import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import { CreateUserDTO, User } from '../models/user.model'

export const registerUser = async (data: CreateUserDTO) => {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  try {
    const result = await query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, avatar, bio, rating, solved_count, submit_count, created_at`,
      [data.username, data.email, hashedPassword, data.role || 'student']
    )

    return result.rows[0]
  } catch (error: any) {
    if (error.code === '23505') {
      if (error.constraint?.includes('username')) {
        throw new Error('用户名已存在')
      }
      if (error.constraint?.includes('email')) {
        throw new Error('邮箱已被注册')
      }
      throw new Error('注册信息重复')
    }
    throw error
  }
}

export const loginUser = async (account: string, password: string) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 OR username = $1',
    [account]
  )

  if (result.rows.length === 0) {
    throw new Error('用户不存在')
  }

  const user = result.rows[0]
  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    throw new Error('密码错误')
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  )

  const { password: _, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export const getUserById = async (id: number) => {
  const result = await query(
    'SELECT id, username, email, role, avatar, bio, rating, solved_count, submit_count FROM users WHERE id = $1',
    [id]
  )

  if (result.rows.length === 0) {
    throw new Error('用户不存在')
  }

  return result.rows[0]
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number; role: string }
  } catch (error) {
    throw new Error('无效的token')
  }
}