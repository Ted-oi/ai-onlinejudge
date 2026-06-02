-- Migration: 用户个人主页增强
-- 成就系统 + Rating 历史 + 用户扩展字段

-- 用户表扩展字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS school VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);

-- 成就徽章表
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  icon VARCHAR(50) DEFAULT 'trophy',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Rating 历史表
CREATE TABLE IF NOT EXISTS rating_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  reason VARCHAR(50),
  contest_id INTEGER REFERENCES contests(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rating_history_user_id ON rating_history(user_id, created_at DESC);

-- 为现有用户初始化成就
INSERT INTO user_achievements (user_id, badge_type, badge_name, description, icon)
SELECT id, 'first_solve', '初出茅庐', '首次解决一道题目', 'rocket'
FROM users WHERE solved_count >= 1
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_achievements (user_id, badge_type, badge_name, description, icon)
SELECT id, 'problem_solver_10', '小有成就', '累计解决 10 道题目', 'star'
FROM users WHERE solved_count >= 10
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_achievements (user_id, badge_type, badge_name, description, icon)
SELECT id, 'problem_solver_50', '解题达人', '累计解决 50 道题目', 'fire'
FROM users WHERE solved_count >= 50
ON CONFLICT (user_id, badge_type) DO NOTHING;

INSERT INTO user_achievements (user_id, badge_type, badge_name, description, icon)
SELECT id, 'centurion', '百题斩', '累计解决 100 道题目', 'crown'
FROM users WHERE solved_count >= 100
ON CONFLICT (user_id, badge_type) DO NOTHING;
