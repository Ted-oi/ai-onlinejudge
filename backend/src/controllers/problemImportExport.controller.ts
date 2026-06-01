import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { logger } from '../utils/logger'

// Export all problems as JSON
export const exportProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, difficulty, category } = req.query
    let queryText = `SELECT p.id, p.title, p.description, p.input_description, p.output_description,
       p.difficulty, p.categories, p.time_limit, p.memory_limit, p.examples,
       p.hint, p.source, p.problem_no
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

    // Get test cases for each problem
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
    res.json({
      version: '1.0',
      exported_at: new Date().toISOString(),
      count: problemsWithTests.length,
      problems: problemsWithTests
    })
  } catch (error) {
    next(error)
  }
}

// Import problems from JSON
export const importProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problems } = req.body

    if (!Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: '无效的导入数据，需要 problems 数组' }
      })
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }

    // Get max problem_no
    const maxNoResult = await query('SELECT COALESCE(MAX(problem_no), 0) as max_no FROM problems')
    let nextNo = maxNoResult.rows[0].max_no + 1

    for (const problem of problems) {
      try {
        if (!problem.title || !problem.description) {
          results.errors.push(`题目 "${problem.title || '未命名'}": 缺少标题或描述`)
          results.failed++
          continue
        }

        const pResult = await query(
          `INSERT INTO problems (title, description, input_description, output_description,
           difficulty, categories, time_limit, memory_limit, examples, hint, source, problem_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            problem.title,
            problem.description,
            problem.input_description || '',
            problem.output_description || '',
            problem.difficulty || 'easy',
            JSON.stringify(problem.categories || []),
            problem.time_limit || 1000,
            problem.memory_limit || 256,
            JSON.stringify(problem.examples || []),
            problem.hint || '',
            problem.source || '',
            problem.problem_no || nextNo++
          ]
        )

        const problemId = pResult.rows[0].id

        // Import test cases
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

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    next(error)
  }
}
