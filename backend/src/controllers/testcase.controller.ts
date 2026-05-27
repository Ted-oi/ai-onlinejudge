import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'

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
