import Database from 'better-sqlite3'
import { logger } from '../utils/logger'

const db = new Database('onlinejudge.db', { verbose: console.log })

// 创建表结构
const initDatabase = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        avatar VARCHAR(255),
        bio TEXT,
        rating INTEGER DEFAULT 1200,
        solved_count INTEGER DEFAULT 0,
        submit_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        time_limit INTEGER NOT NULL,
        memory_limit INTEGER NOT NULL,
        examples TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        is_sample INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER,
        user_id INTEGER,
        language VARCHAR(20) NOT NULL,
        code TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        runtime INTEGER,
        memory INTEGER,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        creator_id INTEGER,
        status VARCHAR(20) DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contest_problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contest_id INTEGER,
        problem_id INTEGER,
        order_index INTEGER NOT NULL,
        UNIQUE(contest_id, problem_id),
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contest_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contest_id INTEGER,
        user_id INTEGER,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contest_id, user_id),
        FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        instructor_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS course_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title VARCHAR(200) NOT NULL,
        type VARCHAR(20) NOT NULL,
        content TEXT,
        file_url VARCHAR(255),
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        material_id INTEGER,
        completed INTEGER DEFAULT 0,
        completed_at DATETIME,
        UNIQUE(user_id, material_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES course_materials(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ai_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        problem_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS ai_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
      CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
    `)

    // 插入示例数据
    try {
      const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com')
      if (!adminExists) {
        const bcrypt = require('bcryptjs')
        const hashedPassword = bcrypt.hashSync('admin123', 10)

        db.prepare(`
          INSERT INTO users (username, email, password, role) VALUES
          ('admin', 'admin@example.com', ?, 'admin'),
          ('student1', 'student1@example.com', ?, 'student')
        `).run(hashedPassword, hashedPassword)
      }

      const problemsExist = db.prepare('SELECT id FROM problems').get()
      if (!problemsExist) {
        db.prepare(`
          INSERT INTO problems (title, description, difficulty, category, time_limit, memory_limit, examples) VALUES
          ('A+B问题', '给定两个整数A和B，计算A+B的值。

输入格式：
第一行包含两个整数A和B，用空格分隔。

输出格式：
输出A+B的值。', 'easy', '基础', 1000, 256, '[{"input":"1 2","output":"3"}]'),
          ('斐波那契数列', '计算斐波那契数列的第n项。斐波那契数列定义为：
F(0) = 0
F(1) = 1
F(n) = F(n-1) + F(n-2) (n ≥ 2)

输入格式：
一个整数n (0 ≤ n ≤ 30)

输出格式：
输出斐波那契数列的第n项。', 'medium', '动态规划', 1000, 256, '[{"input":"5","output":"5"}]'),
          ('最大公约数', '求两个正整数a和b的最大公约数。

输入格式：
两个正整数a和b，用空格分隔。

输出格式：
输出a和b的最大公约数。', 'easy', '数学', 1000, 256, '[{"input":"12 18","output":"6"}]')
        `).run()

        // 为第一个题目添加测试用例
        const problemId = db.prepare('SELECT id FROM problems WHERE title = ?').get('A+B问题') as any
        if (problemId) {
          db.prepare(`
            INSERT INTO test_cases (problem_id, input, output, is_sample) VALUES
            (?, '1 2', '3', 0),
            (?, '100 200', '300', 0),
            (?, '-5 3', '-2', 0)
          `).run(problemId.id, problemId.id, problemId.id)
        }
      }

      logger.info('SQLite数据库初始化完成')
    } catch (error) {
      logger.info('示例数据可能已存在，跳过插入')
    }
  } catch (error) {
    logger.error('数据库初始化失败', error)
  }
}

// 初始化数据库
initDatabase()

export const query = async (text: string, params: any[] = []) => {
  const start = Date.now()
  try {
    // 转换PostgreSQL查询语法到SQLite
    let sqliteText = text
      .replace(/\$1/g, '?')
      .replace(/\$2/g, '?')
      .replace(/\$3/g, '?')
      .replace(/\$4/g, '?')
      .replace(/\$5/g, '?')
      .replace(/\$6/g, '?')
      .replace(/\$7/g, '?')
      .replace(/\$8/g, '?')
      .replace(/\$9/g, '?')
      .replace(/\$10/g, '?')

    // 处理参数化查询中的重复占位符
    const stmt = db.prepare(sqliteText)
    const result = stmt.all(...params)

    const duration = Date.now() - start
    logger.debug('Executed query', { text, duration, rows: Array.isArray(result) ? result.length : 0 })

    return {
      rows: Array.isArray(result) ? result : [],
      rowCount: Array.isArray(result) ? result.length : 0
    }
  } catch (error) {
    logger.error('Query error', { text, error })
    throw error
  }
}

export const getClient = () => db

export default db