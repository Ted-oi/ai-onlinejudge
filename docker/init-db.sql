-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  avatar VARCHAR(255),
  bio TEXT,
  rating INTEGER DEFAULT 1200,
  solved_count INTEGER DEFAULT 0,
  submit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建题目表
CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  time_limit INTEGER NOT NULL,
  memory_limit INTEGER NOT NULL,
  examples JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建测试用例表
CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建提交表
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  runtime INTEGER,
  memory INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建比赛表
CREATE TABLE IF NOT EXISTS contests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建比赛题目关联表
CREATE TABLE IF NOT EXISTS contest_problems (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE(contest_id, problem_id)
);

-- 创建比赛注册表
CREATE TABLE IF NOT EXISTS contest_registrations (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contest_id, user_id)
);

-- 创建课程表
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  instructor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建课程资源表
CREATE TABLE IF NOT EXISTS course_materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  content TEXT,
  file_url VARCHAR(255),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES course_materials(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, material_id)
);

-- 创建AI对话表
CREATE TABLE IF NOT EXISTS ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建AI消息表
CREATE TABLE IF NOT EXISTS ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- 插入示例数据
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@example.com', '$2a$10$Y6mZkZGZ.ZGZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ', 'admin'),
('student1', 'student1@example.com', '$2a$10$Y6mZkZGZ.ZGZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ.GZ', 'student')
ON CONFLICT DO NOTHING;

INSERT INTO problems (title, description, difficulty, category, time_limit, memory_limit, examples) VALUES
('A+B问题', '给定两个整数A和B，计算A+B的值。', 'easy', '基础', 1000, 256, '[{"input":"1 2","output":"3"}]'),
('Fibonacci数列', '计算斐波那契数列的第n项。', 'medium', '动态规划', 1000, 256, '[{"input":"5","output":"5"}]')
ON CONFLICT DO NOTHING;