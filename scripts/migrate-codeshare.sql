-- Migration: 代码分享系统
CREATE TABLE IF NOT EXISTS shared_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE SET NULL,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL,
  tags JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT TRUE,
  pin_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_code_likes (
  id SERIAL PRIMARY KEY,
  shared_code_id INTEGER NOT NULL REFERENCES shared_codes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shared_code_id, user_id)
);

CREATE TABLE IF NOT EXISTS shared_code_comments (
  id SERIAL PRIMARY KEY,
  shared_code_id INTEGER NOT NULL REFERENCES shared_codes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES shared_code_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared_code_pins (
  id SERIAL PRIMARY KEY,
  shared_code_id INTEGER NOT NULL REFERENCES shared_codes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shared_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_codes_user_id ON shared_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_codes_problem_id ON shared_codes(problem_id);
CREATE INDEX IF NOT EXISTS idx_shared_codes_created_at ON shared_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_code_comments_shared_code_id ON shared_code_comments(shared_code_id);
CREATE INDEX IF NOT EXISTS idx_shared_code_likes_user_id ON shared_code_likes(user_id);
