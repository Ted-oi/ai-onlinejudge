import axios from 'axios'
import { query } from '../config/database'
import { logger } from '../utils/logger'

const JUDGE_SERVER_URL = process.env.JUDGE_SERVER_URL || 'http://localhost:8000'
const JUDGE_SERVER_TOKEN = process.env.JUDGE_SERVER_TOKEN || 'your-judge-server-token'

export interface JudgeRequest {
  source_code: string
  language_id: number
  max_time: number
  max_memory: number
  test_cases: Array<{
    input: string
    output: string
  }>
}

export interface JudgeResponse {
  submission_id: string
  status: string
  runtime: number
  memory: number
  error_message?: string
}

export const judgeService = {
  async submitCode(request: JudgeRequest): Promise<JudgeResponse> {
    try {
      const response = await axios.post(
        `${JUDGE_SERVER_URL}/api/submissions`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JUDGE_SERVER_TOKEN}`,
          },
        }
      )
      return response.data
    } catch (error) {
      logger.error('Judge service error', error)
      throw new Error('评测服务不可用')
    }
  },

  async getSubmissionStatus(submissionId: string): Promise<JudgeResponse> {
    try {
      const response = await axios.get(
        `${JUDGE_SERVER_URL}/api/submissions/${submissionId}`,
        {
          headers: {
            'Authorization': `Bearer ${JUDGE_SERVER_TOKEN}`,
          },
        }
      )
      return response.data
    } catch (error) {
      logger.error('Judge service error', error)
      throw new Error('评测服务不可用')
    }
  },

  async getProblemTestCases(problemId: number) {
    const result = await query(
      'SELECT input, output FROM test_cases WHERE problem_id = $1 AND is_sample = false ORDER BY id',
      [problemId]
    )
    return result.rows
  },

  languageToId(language: string): number {
    const languageMap: any = {
      'c': 1,
      'cpp': 2,
      'java': 3,
      'python': 4,
      'python3': 4,
    }
    return languageMap[language.toLowerCase()] || 2
  },

  async processSubmission(submissionId: number) {
    try {
      const submissionResult = await query(
        'SELECT * FROM submissions WHERE id = $1',
        [submissionId]
      )

      if (submissionResult.rows.length === 0) {
        throw new Error('提交记录不存在')
      }

      const submission = submissionResult.rows[0]

      await query(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['judging', submissionId]
      )

      const testCases = await this.getProblemTestCases(submission.problem_id)

      if (testCases.length === 0) {
        await query(
          'UPDATE submissions SET status = $1, error_message = $2 WHERE id = $3',
          ['error', '没有测试用例', submissionId]
        )
        return
      }

      const judgeRequest: JudgeRequest = {
        source_code: submission.code,
        language_id: this.languageToId(submission.language),
        max_time: 1000,
        max_memory: 256,
        test_cases: testCases.map((tc: any) => ({
          input: tc.input,
          output: tc.output,
        })),
      }

      const judgeResult = await this.submitCode(judgeRequest)

      const statusMap: any = {
        'AC': 'accepted',
        'WA': 'wrong_answer',
        'TLE': 'time_limit_exceeded',
        'MLE': 'memory_limit_exceeded',
        'RE': 'runtime_error',
        'CE': 'compilation_error',
      }

      await query(
        `UPDATE submissions
         SET status = $1, runtime = $2, memory = $3, error_message = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          statusMap[judgeResult.status] || 'error',
          judgeResult.runtime || null,
          judgeResult.memory || null,
          judgeResult.error_message || null,
          submissionId,
        ]
      )

      if (judgeResult.status === 'AC') {
        await query(
          `UPDATE users
           SET solved_count = solved_count + 1,
               rating = rating + 10,
               updated_at = NOW()
           WHERE id = $1`,
          [submission.user_id]
        )
      }

      await query(
        `UPDATE users
         SET submit_count = submit_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [submission.user_id]
      )
    } catch (error) {
      logger.error('Process submission error', error)
      await query(
        'UPDATE submissions SET status = $1, error_message = $2 WHERE id = $3',
        ['error', '评测失败', submissionId]
      )
    }
  },
}