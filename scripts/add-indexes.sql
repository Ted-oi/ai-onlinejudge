-- Additional indexes for ai-onlinejudge performance optimization
-- Run this script against the PostgreSQL database: psql -U postgres -d onlinejudge -f add-indexes.sql

-- Submission queries: filter by user+problem, sort by date
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- Contest queries
CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest ON contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);

-- Problem filtering
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Discussion
CREATE INDEX IF NOT EXISTS idx_discussions_problem_id ON discussions(problem_id);

-- User daily activity
CREATE INDEX IF NOT EXISTS idx_user_daily_activity_user_date ON user_daily_activity(user_id, activity_date);
