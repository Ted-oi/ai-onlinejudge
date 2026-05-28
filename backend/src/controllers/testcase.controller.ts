import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import AdmZip from 'adm-zip'
import fs from 'fs'

// 从文件名中提取编号，支持 1.in / 01.in / data1.in / a.in 等格式
function extractIndex(filename: string): string | null {
  const match = filename.match(/^(.+?)\.(\w+)$/)
  if (!match) return null
  return match[1]
}

function parseTestCaseFiles(files: { name: string; content: string }[]): Array<{ input: string; output: string }> {
  const inFiles = new Map<string, string>()
  const outFiles = new Map<string, string>()

  for (const f of files) {
    const idx = extractIndex(f.name)
    if (idx === null) continue
    if (f.name.endsWith('.in')) {
      inFiles.set(idx, f.content)
    } else if (f.name.endsWith('.out') || f.name.endsWith('.ans')) {
      outFiles.set(idx, f.content)
    }
  }

  const cases: Array<{ input: string; output: string }> = []
  for (const [idx, input] of inFiles) {
    const output = outFiles.get(idx)
    if (output !== undefined) {
      cases.push({ input: input.replace(/\r\n/g, '\n'), output: output.replace(/\r\n/g, '\n') })
    }
  }

  return cases
}

export const uploadTestCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const files = req.files as Express.Multer.File[] | undefined
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: { message: '没有上传文件' } })
    }

    const allFiles: { name: string; content: string }[] = []

    for (const file of files) {
      if (file.originalname.endsWith('.zip')) {
        const zip = new AdmZip(file.path)
        const entries = zip.getEntries()
        for (const entry of entries) {
          if (entry.isDirectory) continue
          const name = entry.entryName.split('/').pop() || entry.entryName
          if (name.endsWith('.in') || name.endsWith('.out') || name.endsWith('.ans')) {
            allFiles.push({ name, content: entry.getData().toString('utf-8') })
          }
        }
      } else if (file.originalname.endsWith('.in') || file.originalname.endsWith('.out') || file.originalname.endsWith('.ans')) {
        const content = fs.readFileSync(file.path, 'utf-8')
        allFiles.push({ name: file.originalname, content })
      }
    }

    // clean up temp files
    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    }

    const testCases = parseTestCaseFiles(allFiles)
    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '未找到有效的 .in/.out 文件对。请确保文件名配对，如 1.in + 1.out' },
      })
    }

    const inserted: any[] = []
    for (const tc of testCases) {
      const result = await query(
        'INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES ($1, $2, $3, $4) RETURNING id, problem_id, input, output, is_sample, created_at',
        [id, tc.input, tc.output, false]
      )
      inserted.push(result.rows[0])
    }

    res.status(201).json({ success: true, data: { test_cases: inserted, count: inserted.length } })
  } catch (error) {
    next(error)
  }
}

export const getTestCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await query(
      'SELECT id, problem_id, input, output, is_sample, created_at FROM test_cases WHERE problem_id = $1 ORDER BY id',
      [id]
    )
    res.json({ success: true, data: { test_cases: result.rows } })
  } catch (error) {
    next(error)
  }
}

export const createTestCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { input, output, is_sample } = req.body

    if (input === undefined || output === undefined) {
      return res.status(400).json({ success: false, error: { message: 'input 和 output 不能为空' } })
    }

    const result = await query(
      `INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES ($1, $2, $3, $4) RETURNING id, problem_id, input, output, is_sample, created_at`,
      [id, input, output, is_sample ?? false]
    )
    res.status(201).json({ success: true, data: { test_case: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const updateTestCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params
    const { input, output, is_sample } = req.body

    const result = await query(
      `UPDATE test_cases SET input = COALESCE($1, input), output = COALESCE($2, output), is_sample = COALESCE($3, is_sample) WHERE id = $4 RETURNING id, problem_id, input, output, is_sample, created_at`,
      [input, output, is_sample, caseId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '测试用例不存在' } })
    }
    res.json({ success: true, data: { test_case: result.rows[0] } })
  } catch (error) {
    next(error)
  }
}

export const deleteTestCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params
    const result = await query('DELETE FROM test_cases WHERE id = $1 RETURNING id', [caseId])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: '测试用例不存在' } })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    next(error)
  }
}

export const batchCreateTestCases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { test_cases } = req.body as { test_cases: Array<{ input: string; output: string; is_sample?: boolean }> }

    if (!Array.isArray(test_cases) || test_cases.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'test_cases 必须是非空数组' } })
    }

    const inserted: any[] = []
    for (const tc of test_cases) {
      const result = await query(
        `INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES ($1, $2, $3, $4) RETURNING id, problem_id, input, output, is_sample, created_at`,
        [id, tc.input, tc.output, tc.is_sample ?? false]
      )
      inserted.push(result.rows[0])
    }

    res.status(201).json({ success: true, data: { test_cases: inserted } })
  } catch (error) {
    next(error)
  }
}
