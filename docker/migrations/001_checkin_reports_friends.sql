-- ============================================
-- 001: 每日签到 / 题目纠错 / 好友私信 / 用户积分
-- 所有语句必须幂等，每次启动都执行一遍
-- ============================================

-- ---------- 用户积分表 ----------
CREATE TABLE IF NOT EXISTS user_points (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_points_points ON user_points(points DESC);

-- ---------- 每日签到表 ----------
CREATE TABLE IF NOT EXISTS user_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  consecutive_days INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_user_checkins_user_id ON user_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_checkins_date ON user_checkins(checkin_date DESC);

-- ---------- 月度全勤奖励（防重复发奖） ----------
CREATE TABLE IF NOT EXISTS checkin_monthly_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month CHAR(7) NOT NULL,
  consecutive_days INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, year_month)
);

-- ---------- 题目纠错反馈表 ----------
CREATE TABLE IF NOT EXISTS problem_reports (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'normal',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_problem_reports_problem_id ON problem_reports(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_problem_reports_user_id ON problem_reports(user_id);

-- ---------- 好友关系表 ----------
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status ON friendships(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_status ON friendships(requester_id, status);

-- ---------- 对话表 ----------
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'direct',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 对话参与者表
CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);

-- ---------- 消息表 ----------
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ---------- 老好友关系补建会话（幂等）----------
DO $$
DECLARE
  fr RECORD;
  conv_id INTEGER;
  exists_count INTEGER;
BEGIN
  FOR fr IN
    SELECT DISTINCT
           LEAST(requester_id, addressee_id) AS a,
           GREATEST(requester_id, addressee_id) AS b
      FROM friendships
      WHERE status = 'accepted'
  LOOP
    SELECT COUNT(*) INTO exists_count
      FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      JOIN conversations c ON c.id = cp1.conversation_id
      WHERE cp1.user_id = fr.a AND cp2.user_id = fr.b AND c.type = 'direct';

    IF exists_count = 0 THEN
      INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO conv_id;
      INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (conv_id, fr.a), (conv_id, fr.b)
        ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
