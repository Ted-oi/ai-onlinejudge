-- Migration: 客观题功能
ALTER TABLE problems ADD COLUMN IF NOT EXISTS problem_type VARCHAR(20) NOT NULL DEFAULT 'coding';
ALTER TABLE problems ADD COLUMN IF NOT EXISTS objective_data JSONB;
CREATE INDEX IF NOT EXISTS idx_problems_problem_type ON problems(problem_type);
