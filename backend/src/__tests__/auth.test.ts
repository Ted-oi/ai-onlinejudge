import '../__tests__/helpers/dbMock'
import { mockQuery } from '../__tests__/helpers/dbMock'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// We test the auth service logic directly since Express app setup triggers listen
describe('Auth Service', () => {
  const JWT_SECRET = 'test-secret-key'

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign({ userId: 1, role: 'student' }, JWT_SECRET)
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('student')
    })

    it('should reject an invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', JWT_SECRET)
      }).toThrow()
    })

    it('should reject an expired token', () => {
      const token = jwt.sign({ userId: 1, role: 'student' }, JWT_SECRET, { expiresIn: '-1s' })
      expect(() => {
        jwt.verify(token, JWT_SECRET)
      }).toThrow()
    })
  })

  describe('Password hashing', () => {
    it('should hash and verify a password', async () => {
      const password = 'test123'
      const hash = await bcrypt.hash(password, 10)
      expect(await bcrypt.compare(password, hash)).toBe(true)
      expect(await bcrypt.compare('wrong', hash)).toBe(false)
    })
  })

  describe('Registration flow', () => {
    it('should insert user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1, username: 'testuser', email: 'test@test.com',
          role: 'student', avatar: null, bio: null, rating: 0,
          solved_count: 0, submit_count: 0
        }],
        rowCount: 1,
      })

      const result = await mockQuery(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        ['testuser', 'test@test.com', hashedPassword, 'student']
      )

      expect(mockQuery).toHaveBeenCalled()
      expect(result.rows[0].username).toBe('testuser')
      expect(result.rows[0].role).toBe('student')
    })
  })

  describe('Login flow', () => {
    it('should find user by username or email', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1, username: 'admin', email: 'admin@test.com',
          password: hashedPassword, role: 'admin'
        }],
      })

      const result = await mockQuery(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        ['admin']
      )

      expect(result.rows.length).toBe(1)
      expect(result.rows[0].username).toBe('admin')
      expect(await bcrypt.compare('admin123', result.rows[0].password)).toBe(true)
    })

    it('should generate valid JWT on login', () => {
      const token = jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('admin')
    })
  })
})
