-- Migration: 学习路径系统
CREATE TABLE IF NOT EXISTS learning_paths (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  cover_color VARCHAR(20) DEFAULT '#4f46e5',
  estimated_hours INTEGER,
  creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_path_stages (
  id SERIAL PRIMARY KEY,
  path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  required_solved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_path_problems (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER NOT NULL REFERENCES learning_path_stages(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stage_id, problem_id)
);

CREATE TABLE IF NOT EXISTS user_path_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS user_path_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL REFERENCES learning_path_stages(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, path_id, stage_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_path_stages_path_id ON learning_path_stages(path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_problems_stage_id ON learning_path_problems(stage_id);
CREATE INDEX IF NOT EXISTS idx_user_path_enrollments_user_id ON user_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_path_progress_user_path ON user_path_progress(user_id, path_id);
