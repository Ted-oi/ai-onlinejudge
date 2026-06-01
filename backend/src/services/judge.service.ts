import axios from 'axios'
import crypto from 'crypto'
import { query } from '../config/database'
import { logger } from '../utils/logger'
import { localJudge, isLocalJudgeAvailable } from './localJudge'
import { createNotification } from '../controllers/notification.controller'

const JUDGE_SERVER_URL = process.env.JUDGE_SERVER_URL || 'http://localhost:8000'
const JUDGE_SERVER_TOKEN = process.env.JUDGE_SERVER_TOKEN || 'onlinejudge-judge-secret-2024'

const judgeHeaders = {
  'Content-Type': 'application/json',
  'X-Judge-Server-Token': crypto.createHash('sha256').update(JUDGE_SERVER_TOKEN).digest('hex'),
}

const LANGUAGE_CONFIGS: Record<string, any> = {
  c: {
    compile: {
      src_name: 'main.c',
      exe_name: 'main',
      max_cpu_time: 3000,
      max_real_time: 5000,
      max_memory: 128 * 1024 * 1024,
      compile_command: '/usr/bin/gcc -DONLINE_JUDGE -O2 -w -fmax-errors=3 -std=c99 {src_path} -lm -o {exe_path}',
    },
    run: {
      command: '{exe_path}',
      seccomp_rule: 'c_cpp',
      env: ['LANG=en_US.UTF-8', 'LANGUAGE=en_US:en', 'LC_ALL=en_US.UTF-8'],
    },
  },
  cpp: {
    compile: {
      src_name: 'main.cpp',
      exe_name: 'main',
      max_cpu_time: 3000,
      max_real_time: 5000,
      max_memory: 128 * 1024 * 1024,
      compile_command: '/usr/bin/g++ -DONLINE_JUDGE -O2 -w -fmax-errors=3 -std=c++11 {src_path} -lm -o {exe_path}',
    },
    run: {
      command: '{exe_path}',
      seccomp_rule: 'c_cpp',
      env: ['LANG=en_US.UTF-8', 'LANGUAGE=en_US:en', 'LC_ALL=en_US.UTF-8'],
    },
  },
  java: {
    compile: {
      src_name: 'Main.java',
      exe_name: 'Main',
      max_cpu_time: 3000,
      max_real_time: 5000,
      max_memory: -1,
      compile_command: '/usr/bin/javac {src_path} -d {exe_dir} -encoding UTF8',
    },
    run: {
      command: '/usr/bin/java -cp {exe_dir} -XX:MaxRAM={max_memory}k -Djava.security.manager -Dfile.encoding=UTF-8 -Djava.security.policy==/etc/java_policy -Djava.awt.headless=true Main',
      seccomp_rule: null,
      env: ['LANG=en_US.UTF-8', 'LANGUAGE=en_US:en', 'LC_ALL=en_US.UTF-8'],
      memory_limit_check_only: 1,
    },
  },
  python: {
    compile: {
      src_name: 'solution.py',
      exe_name: '__pycache__/solution.cpython-36.pyc',
      max_cpu_time: 3000,
      max_real_time: 5000,
      max_memory: 128 * 1024 * 1024,
      compile_command: '/usr/bin/python3 -m py_compile {src_path}',
    },
    run: {
      command: '/usr/bin/python3 {exe_path}',
      seccomp_rule: 'general',
      env: ['PYTHONIOENCODING=UTF-8', 'LANG=en_US.UTF-8', 'LANGUAGE=en_US:en', 'LC_ALL=en_US.UTF-8'],
    },
  },
}

const RESULT_ACCEPTED = 0
const RESULT_WRONG_ANSWER = -1
const RESULT_CPU_TIME_LIMIT_EXCEEDED = 1
const RESULT_REAL_TIME_LIMIT_EXCEEDED = 2
const RESULT_MEMORY_LIMIT_EXCEEDED = 3
const RESULT_RUNTIME_ERROR = 4
const RESULT_SYSTEM_ERROR = -2
const RESULT_COMPILATION_ERROR = -3

function mapResult(resultId: number): string {
  switch (resultId) {
    case RESULT_ACCEPTED: return 'accepted'
    case RESULT_WRONG_ANSWER: return 'wrong_answer'
    case RESULT_CPU_TIME_LIMIT_EXCEEDED:
    case RESULT_REAL_TIME_LIMIT_EXCEEDED: return 'time_limit_exceeded'
    case RESULT_MEMORY_LIMIT_EXCEEDED: return 'memory_limit_exceeded'
    case RESULT_RUNTIME_ERROR: return 'runtime_error'
    case RESULT_COMPILATION_ERROR: return 'compilation_error'
    case RESULT_SYSTEM_ERROR:
    default: return 'system_error'
  }
}

async function remoteJudge(
  src: string,
  language: string,
  maxCpuTime: number,
  maxMemory: number,
  testCases: Array<{ input: string; output: string }>
): Promise<{
  status: string
  runtime: number | null
  memory: number | null
  errorMessage: string | null
}> {
  const languageConfig = LANGUAGE_CONFIGS[language.toLowerCase()]
  if (!languageConfig) {
    return { status: 'compilation_error', runtime: null, memory: null, errorMessage: `不支持的语言: ${language}` }
  }

  const response = await axios.post(
    `${JUDGE_SERVER_URL}/judge`,
    {
      language_config: languageConfig,
      src,
      max_cpu_time: maxCpuTime,
      max_memory: maxMemory * 1024 * 1024,
      test_case: testCases.map((tc) => ({
        input: tc.input.endsWith('\n') ? tc.input : tc.input + '\n',
        output: tc.output.endsWith('\n') ? tc.output : tc.output + '\n',
      })),
      output: false,
    },
    { headers: judgeHeaders, timeout: 30000 }
  )

  const data = response.data
  if (data.error) {
    return { status: 'system_error', runtime: null, memory: null, errorMessage: data.message || '评测系统错误' }
  }

  const results: any[] = data.data || data
  if (!Array.isArray(results) || results.length === 0) {
    return { status: 'system_error', runtime: null, memory: null, errorMessage: '评测结果为空' }
  }

  let worstStatus = RESULT_ACCEPTED
  let peakRuntime = 0
  let peakMemory = 0
  let errorMessage: string | null = null

  for (const result of results) {
    const resultId = result.result || result.code || 0
    if (resultId !== RESULT_ACCEPTED && (worstStatus === RESULT_ACCEPTED || resultId < worstStatus)) {
      worstStatus = resultId
      if (resultId === RESULT_COMPILATION_ERROR && result.stderr) {
        errorMessage = result.stderr
      }
    }
    if (result.cpu_time) peakRuntime = Math.max(peakRuntime, result.cpu_time)
    if (result.memory) peakMemory = Math.max(peakMemory, result.memory)
  }

  return {
    status: mapResult(worstStatus),
    runtime: peakRuntime > 0 ? peakRuntime : null,
    memory: peakMemory > 0 ? Math.round(peakMemory / 1024) : null,
    errorMessage,
  }
}

export const judgeService = {
  async ping(): Promise<boolean> {
    if (isLocalJudgeAvailable('cpp')) return true
    try {
      const resp = await axios.post(`${JUDGE_SERVER_URL}/ping`, null, { headers: judgeHeaders })
      return resp.data && !resp.data.error
    } catch {
      return false
    }
  },

  async judgeCode(
    src: string,
    language: string,
    maxCpuTime: number,
    maxMemory: number,
    testCases: Array<{ input: string; output: string }>
  ): Promise<{
    status: string
    runtime: number | null
    memory: number | null
    errorMessage: string | null
  }> {
    const lang = language.toLowerCase()
    if (isLocalJudgeAvailable(lang)) {
      logger.info(`Using local judge for language: ${lang}`)
      return localJudge(src, language, maxCpuTime, maxMemory, testCases)
    }

    logger.info(`Local judge unavailable for ${lang}, trying remote judge-server`)
    try {
      return await remoteJudge(src, language, maxCpuTime, maxMemory, testCases)
    } catch (error: any) {
      logger.error('Remote judge service error', error.message || error)
      return { status: 'system_error', runtime: null, memory: null, errorMessage: '评测服务不可用，请稍后重试' }
    }
  },

  async processSubmission(submissionId: number) {
    try {
      const submissionResult = await query(
        'SELECT * FROM submissions WHERE id = $1',
        [submissionId]
      )

      if (submissionResult.rows.length === 0) {
        throw new Error('提交记录不存在')
      }

      const submission = submissionResult.rows[0]

      await query(
        'UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2',
        ['judging', submissionId]
      )

      const problemResult = await query(
        'SELECT time_limit, memory_limit FROM problems WHERE id = $1',
        [submission.problem_id]
      )

      if (problemResult.rows.length === 0) {
        await query(
          'UPDATE submissions SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
          ['error', '题目不存在', submissionId]
        )
        return
      }

      const problem = problemResult.rows[0]

      // Get test cases
      const testCases = await query(
        'SELECT input, output FROM test_cases WHERE problem_id = $1 ORDER BY id',
        [submission.problem_id]
      )

      let cases = testCases.rows
      if (cases.length === 0) {
        const examplesResult = await query(
          'SELECT examples FROM problems WHERE id = $1',
          [submission.problem_id]
        )
        cases = examplesResult.rows[0]?.examples || []
      }

      if (cases.length === 0) {
        await query(
          'UPDATE submissions SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
          ['error', '没有测试用例', submissionId]
        )
        return
      }

      const judgeResult = await judgeService.judgeCode(
        submission.code,
        submission.language,
        problem.time_limit || 1000,
        problem.memory_limit || 256,
        cases
      )

      await query(
        `UPDATE submissions
         SET status = $1, runtime = $2, memory = $3, error_message = $4, updated_at = NOW()
         WHERE id = $5`,
        [judgeResult.status, judgeResult.runtime, judgeResult.memory, judgeResult.errorMessage, submissionId]
      )

      await judgeService.updateUserStats(submission.user_id, judgeResult.status)

      const problemResult2 = await query('SELECT title FROM problems WHERE id = $1', [submission.problem_id])
      const problemTitle = problemResult2.rows[0]?.title || '未知题目'

      if (judgeResult.status === 'accepted') {
        createNotification(submission.user_id, 'submission_result', '提交通过',
          `你提交的题目「${problemTitle}」已通过评测！`, `/submissions/${submissionId}`)
      } else {
        const statusMap: Record<string, string> = {
          wrong_answer: '答案错误', time_limit_exceeded: '超时',
          memory_limit_exceeded: '内存超限', runtime_error: '运行时错误',
          compilation_error: '编译错误', system_error: '系统错误'
        }
        createNotification(submission.user_id, 'submission_result', '提交结果',
          `题目「${problemTitle}」评测结果：${statusMap[judgeResult.status] || judgeResult.status}`,
          `/submissions/${submissionId}`)
      }

      await judgeService.updateSkillAndActivity(submission.user_id, submission.problem_id, judgeResult.status)
    } catch (error: any) {
      logger.error('Process submission error', error)
      await query(
        'UPDATE submissions SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
        ['system_error', '评测失败: ' + (error.message || '未知错误'), submissionId]
      )
    }
  },

  async updateUserStats(userId: number, status: string) {
    try {
      if (status === 'accepted') {
        await query(
          `UPDATE users
           SET submit_count = submit_count + 1,
               solved_count = solved_count + 1,
               rating = rating + 10,
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        )
      } else {
        await query(
          `UPDATE users
           SET submit_count = submit_count + 1,
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        )
      }
    } catch (error) {
      logger.error('Update user stats error', error)
    }
  },

  async updateSkillAndActivity(userId: number, problemId: number, status: string) {
    try {
      const problemResult = await query('SELECT category FROM problems WHERE id = $1', [problemId])
      if (problemResult.rows.length === 0) return
      const category = problemResult.rows[0].category

      await query(
        `INSERT INTO user_skills (user_id, category, solved_count, attempt_count)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, category) DO UPDATE SET
           attempt_count = user_skills.attempt_count + 1,
           solved_count = user_skills.solved_count + $3,
           updated_at = NOW()`,
        [userId, category, status === 'accepted' ? 1 : 0, 1]
      )

      const today = new Date().toISOString().split('T')[0]
      await query(
        `INSERT INTO user_daily_activity (user_id, activity_date, submission_count, solved_count)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (user_id, activity_date) DO UPDATE SET
           submission_count = user_daily_activity.submission_count + 1,
           solved_count = user_daily_activity.solved_count + $3`,
        [userId, today, status === 'accepted' ? 1 : 0]
      )
    } catch (error) {
      logger.error('Update skill and activity error', error)
    }
  },
}
