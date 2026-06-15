import fs from 'fs'
import path from 'path'
import os from 'os'
import { LANG_CONFIG, runProcess } from '../services/localJudge'
import { logger } from '../utils/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'
import { badRequest } from '../utils/apiError'

const COMPILE_TIMEOUT = 10000

export const executeCode = asyncHandler(async (req, res) => {
  try {
    const { code, language = 'cpp', input = '', timeLimit = 5000 } = req.body

    if (!code || typeof code !== 'string') {
      throw badRequest('请提供代码')
    }

    const lang = language.toLowerCase()
    const config = LANG_CONFIG[lang]
    if (!config) {
      throw badRequest(`不支持的语言: ${language}`)
    }

    const clampedTimeLimit = Math.min(Math.max(Number(timeLimit) || 5000, 1000), 10000)

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oj-playground-'))
    try {
      // Compile
      const compileError = config.compile(code, workDir)
      if (compileError) {
        return sendSuccess(res, {
          status: 'compilation_error',
          stdout: '',
          stderr: compileError,
          exitCode: 1,
          runtime: 0,
        })
      }

      // Run
      const stdin = input.endsWith('\n') ? input : input + '\n'
      const result = await runProcess(
        lang === 'python'
          ? 'python'
          : lang === 'java'
            ? 'java'
            : path.join(workDir, 'main'),
        lang === 'python' ? [path.join(workDir, 'solution.py')] : lang === 'java' ? ['-Dfile.encoding=UTF-8', `-Duser.dir=${workDir}`, 'Main'] : [],
        workDir,
        stdin,
        clampedTimeLimit,
      )

      const timedOut = result.signal === 'SIGKILL' || result.runtime > clampedTimeLimit

      return sendSuccess(res, {
        status: timedOut ? 'time_limit_exceeded' : result.exitCode !== 0 ? 'runtime_error' : 'success',
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        runtime: result.runtime,
        signal: result.signal,
      })
    } finally {
      try { fs.rmSync(workDir, { recursive: true, force: true }) } catch { /* best-effort */ }
    }
  } catch (err: any) {
    logger.error('Playground execute error', err)
    throw err
  }
})
