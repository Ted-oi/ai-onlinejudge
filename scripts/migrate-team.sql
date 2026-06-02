-- Migration: 团队/班级系统
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar VARCHAR(255),
  team_type VARCHAR(20) NOT NULL DEFAULT 'team' CHECK (team_type IN ('team', 'class')),
  leader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(20) UNIQUE,
  max_members INTEGER DEFAULT 50,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'co_leader', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_contests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  team_id_1 INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_id_2 INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  problem_ids JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'upcoming',
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_contests_team1 ON team_contests(team_id_1);
CREATE INDEX IF NOT EXISTS idx_team_contests_team2 ON team_contests(team_id_2);
