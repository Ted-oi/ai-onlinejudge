import { query } from '../config/database'
import * as XLSX from 'xlsx'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { badRequest } from '../utils/apiError'
import { excelUpload } from '../config/uploads'

export const exportProblems = asyncHandler(async (req, res) => {
  const { ids, difficulty, category } = req.query
  let queryText = `SELECT p.id, p.title, p.description, p.difficulty, p.category, p.categories,
     p.time_limit, p.memory_limit, p.examples, p.problem_no, p.problem_type, p.objective_data
     FROM problems p WHERE 1=1`
  const params: any[] = []
  let paramCount = 1

  if (ids) {
    const idList = String(ids).split(',').map(Number).filter(n => !isNaN(n))
    if (idList.length > 0) {
      queryText += ` AND p.id = ANY($${paramCount++})`
      params.push(idList)
    }
  }

  if (difficulty) {
    queryText += ` AND p.difficulty = $${paramCount++}`
    params.push(difficulty)
  }

  if (category) {
    queryText += ` AND p.categories @> $${paramCount++}::jsonb`
    params.push(JSON.stringify([category]))
  }

  queryText += ' ORDER BY p.problem_no ASC'

  const result = await query(queryText, params)

  const problemsWithTests = await Promise.all(
    result.rows.map(async (problem: any) => {
      const tcResult = await query(
        'SELECT input, output, is_sample FROM test_cases WHERE problem_id = $1 ORDER BY id',
        [problem.id]
      )
      return { ...problem, test_cases: tcResult.rows }
    })
  )

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', 'attachment; filename=problems_export.json')
  // Non-envelope response: export format intentionally differs from { success: true, data }
  res.json({
    version: '1.0',
    exported_at: new Date().toISOString(),
    count: problemsWithTests.length,
    problems: problemsWithTests
  })
})

export const importProblems = asyncHandler(async (req, res) => {
  const { problems } = req.body

  if (!Array.isArray(problems) || problems.length === 0) {
    throw badRequest('无效的导入数据，需要 problems 数组')
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  const maxNoResult = await query("SELECT COALESCE(MAX(CAST(SUBSTRING(problem_no, 2) AS INTEGER)), 0) as max_no FROM problems WHERE problem_no ~ '^[PT]\\d+$'")
  let nextNo = maxNoResult.rows[0].max_no + 1

  for (const problem of problems) {
    try {
      if (!problem.title || !problem.description) {
        results.errors.push(`题目 "${problem.title || '未命名'}": 缺少标题或描述`)
        results.failed++
        continue
      }

      const category = problem.category || (Array.isArray(problem.categories) && problem.categories.length > 0 ? problem.categories[0] : '其他')

      const pResult = await query(
        `INSERT INTO problems (title, description, difficulty, category, categories,
         time_limit, memory_limit, examples, problem_no, problem_type, objective_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          problem.title,
          problem.description,
          problem.difficulty || 'easy',
          category,
          JSON.stringify(problem.categories || []),
          problem.time_limit || 1000,
          problem.memory_limit || 256,
          JSON.stringify(problem.examples || []),
          problem.problem_no || `P${String(nextNo++).padStart(5, '0')}`,
          problem.problem_type || 'coding',
          problem.objective_data ? JSON.stringify(problem.objective_data) : null,
        ]
      )

      const problemId = pResult.rows[0].id

      if (Array.isArray(problem.test_cases)) {
        for (const tc of problem.test_cases) {
          await query(
            'INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES ($1, $2, $3, $4)',
            [problemId, tc.input || '', tc.output || '', tc.is_sample ? 1 : 0]
          )
        }
      }

      results.success++
    } catch (err: any) {
      results.errors.push(`题目 "${problem.title}": ${err.message}`)
      results.failed++
    }
  }

  return sendSuccess(res, results)
})

// Download Excel template for objective questions
export const downloadObjectiveTemplate = asyncHandler(async (req, res) => {
  const headers = [
    '题目标题', '题目描述', '题目类型(choice/judge)', '难度(easy/medium/hard)',
    '分类', '选项A', '选项B', '选项C', '选项D', '正确答案(A/B/C/D 或 对/错)',
  ]

  const examples = [
    ['下列哪个是 O(n log n) 排序算法？', '请选择正确答案', 'choice', 'easy', '算法', '冒泡排序', '快速排序', '插入排序', '选择排序', 'B'],
    ['栈是一种先进先出的数据结构', '判断对错', 'judge', 'easy', '数据结构', '', '', '', '', '错'],
    ['TCP 协议工作在哪一层？', '请选择正确答案', 'choice', 'medium', '网络', '数据链路层', '网络层', '传输层', '应用层', 'C'],
  ]

  // Second row as description row
  const descriptions = [
    '必填', '选填，支持 Markdown', '必填', '必填',
    '选填', '单选题必填', '单选题必填', '选填', '选填', '必填',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, descriptions, ...examples])

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 22 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 28 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '客观题导入模板')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=objective_template.xlsx')
  res.send(buffer)
})

// Import objective questions from Excel
export const importObjectiveExcel = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw badRequest('请上传 Excel 文件')
  }

  const workbook = XLSX.readFile(req.file.path)
  const sheetName = workbook.SheetNames[0]
  const ws = workbook.Sheets[sheetName]
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Skip header row and description row
  const dataRows = rows.slice(2).filter(row => row[0] && String(row[0]).trim())

  if (dataRows.length === 0) {
    throw badRequest('Excel 中没有有效数据')
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  const maxNoResult = await query("SELECT COALESCE(MAX(CAST(SUBSTRING(problem_no, 2) AS INTEGER)), 0) as max_no FROM problems WHERE problem_no ~ '^[PT]\\d+$'")
  let nextNo = maxNoResult.rows[0].max_no + 1

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const rowNum = i + 3 // actual row number in Excel (1-indexed, skip 2 header rows)

    try {
      const title = String(row[0] || '').trim()
      const description = String(row[1] || '').trim()
      const typeRaw = String(row[2] || '').trim().toLowerCase()
      const difficulty = String(row[3] || 'easy').trim().toLowerCase()
      const category = String(row[4] || '').trim() || '其他'
      const optA = String(row[5] || '').trim()
      const optB = String(row[6] || '').trim()
      const optC = String(row[7] || '').trim()
      const optD = String(row[8] || '').trim()
      const answerRaw = String(row[9] || '').trim()

      if (!title) { results.errors.push(`第 ${rowNum} 行: 题目标题为空`); results.failed++; continue }

      let objectiveData: any
      let problemType = 'objective'

      if (typeRaw === 'choice' || typeRaw === '单选') {
        const options = [optA, optB, optC, optD].filter(o => o)
        if (options.length < 2) { results.errors.push(`第 ${rowNum} 行: 单选题至少需要2个选项`); results.failed++; continue }

        const answerMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 }
        const answerIdx = answerMap[answerRaw.toLowerCase()]
        if (answerIdx === undefined || answerIdx >= options.length) { results.errors.push(`第 ${rowNum} 行: 正确答案无效(${answerRaw})`); results.failed++; continue }

        objectiveData = { type: 'choice', options, answer: answerIdx }
      } else if (typeRaw === 'judge' || typeRaw === '判断') {
        const isTrue = answerRaw === '对' || answerRaw === '正确' || answerRaw.toLowerCase() === 'true' || answerRaw === 'T'
        const isFalse = answerRaw === '错' || answerRaw === '错误' || answerRaw.toLowerCase() === 'false' || answerRaw === 'F'
        if (!isTrue && !isFalse) { results.errors.push(`第 ${rowNum} 行: 判断题答案无效(${answerRaw})，请填 对/错`); results.failed++; continue }

        objectiveData = { type: 'judge', answer: isTrue }
      } else {
        results.errors.push(`第 ${rowNum} 行: 题目类型无效(${typeRaw})，请填 choice 或 judge`); results.failed++; continue
      }

      const validDifficulties = ['easy', 'medium', 'hard']
      const finalDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'easy'

      await query(
        `INSERT INTO problems (title, description, difficulty, category, categories, time_limit, memory_limit, problem_type, objective_data, problem_no)
         VALUES ($1, $2, $3, $4, $5, 0, 0, 'objective', $6, $7)`,
        [title, description || title, finalDifficulty, category, JSON.stringify([category]), JSON.stringify(objectiveData), `T${String(nextNo++).padStart(5, '0')}`]
      )

      results.success++
    } catch (err: any) {
      results.errors.push(`第 ${rowNum} 行: ${err.message}`)
      results.failed++
    }
  }

  // Clean up uploaded file
  try { require('fs').unlinkSync(req.file!.path) } catch {}

  return sendSuccess(res, results)
})
