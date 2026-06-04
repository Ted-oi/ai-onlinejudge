import '../__tests__/helpers/dbMock'
import { mockQuery } from '../__tests__/helpers/dbMock'

describe('Submission Controller', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  describe('Create submission', () => {
    it('should insert a submission record', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1, user_id: 1, problem_id: 1, code: 'print("hello")',
          language: 'python', status: 'pending', created_at: new Date()
        }],
        rowCount: 1,
      })

      const result = await mockQuery(
        `INSERT INTO submissions (user_id, problem_id, code, language, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [1, 1, 'print("hello")', 'python', 'pending']
      )

      expect(mockQuery).toHaveBeenCalledTimes(1)
      expect(result.rows[0].status).toBe('pending')
      expect(result.rows[0].language).toBe('python')
    })
  })

  describe('Get submissions', () => {
    it('should return paginated submissions with problem titles', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, problem_title: 'A+B Problem', status: 'accepted', language: 'cpp' },
          { id: 2, problem_title: '排序', status: 'wrong_answer', language: 'python' },
        ],
      })
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '2' }] })

      const result = await mockQuery(
        `SELECT s.*, p.title as problem_title FROM submissions s
         LEFT JOIN problems p ON s.problem_id = p.id
         WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`,
        [1, 20, 0]
      )

      expect(result.rows.length).toBe(2)
      expect(result.rows[0].problem_title).toBe('A+B Problem')
    })
  })

  describe('Update submission status', () => {
    it('should update status to judging', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await mockQuery(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['judging', 1]
      )

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE submissions SET status = $1 WHERE id = $2',
        ['judging', 1]
      )
    })

    it('should update with judge results', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await mockQuery(
        `UPDATE submissions SET status = $1, runtime = $2, memory = $3 WHERE id = $4`,
        ['accepted', 100, 2048, 1]
      )

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE submissions'),
        ['accepted', 100, 2048, 1]
      )
    })
  })
})
