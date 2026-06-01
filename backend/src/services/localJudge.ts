import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { logger } from '../utils/logger'

interface JudgeResult {
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error' | 'system_error'
  runtime: number | null
  memory: number | null
  errorMessage: string | null
}

interface TestCaseResult {
  passed: boolean
  status: string
  runtime: number
  memory: number
  stderr: string
}

const COMPILE_TIMEOUT = 10000

const LANG_CONFIG: Record<string, {
  srcFile: string
  compile: (src: string, workDir: string) => string | null
  run: (workDir: string, input: string, timeLimit: number) => Promise<{ stdout: string; stderr: string; runtime: number; exitCode: number; signal: string | null }>
}> = {
  cpp: {
    srcFile: 'main.cpp',
    compile(src, workDir) {
      const srcPath = path.join(workDir, 'main.cpp')
      fs.writeFileSync(srcPath, src, 'utf-8')
      try {
        execSync(`g++ -O2 -w -fmax-errors=3 -std=c++17 "${srcPath}" -o "${path.join(workDir, 'main')}"`, {
          timeout: COMPILE_TIMEOUT,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        return null
      } catch (e: any) {
        return e.stderr || e.message || '编译失败'
      }
    },
    async run(workDir, input, timeLimit) {
      return runProcess(path.join(workDir, 'main'), [], workDir, input, timeLimit)
    },
  },
  c: {
    srcFile: 'main.c',
    compile(src, workDir) {
      const srcPath = path.join(workDir, 'main.c')
      fs.writeFileSync(srcPath, src, 'utf-8')
      try {
        execSync(`gcc -O2 -w -fmax-errors=3 -std=c99 "${srcPath}" -lm -o "${path.join(workDir, 'main')}"`, {
          timeout: COMPILE_TIMEOUT,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        return null
      } catch (e: any) {
        return e.stderr || e.message || '编译失败'
      }
    },
    async run(workDir, input, timeLimit) {
      return runProcess(path.join(workDir, 'main'), [], workDir, input, timeLimit)
    },
  },
  java: {
    srcFile: 'Main.java',
    compile(src, workDir) {
      const srcPath = path.join(workDir, 'Main.java')
      fs.writeFileSync(srcPath, src, 'utf-8')
      try {
        execSync(`javac "${srcPath}" -d "${workDir}" -encoding UTF8`, {
          timeout: COMPILE_TIMEOUT,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        return null
      } catch (e: any) {
        return e.stderr || e.message || '编译失败'
      }
    },
    async run(workDir, input, timeLimit) {
      return runProcess('java', ['-Dfile.encoding=UTF-8', `-Duser.dir=${workDir}`, 'Main'], workDir, input, timeLimit)
    },
  },
  python: {
    srcFile: 'solution.py',
    compile(src, workDir) {
      const srcPath = path.join(workDir, 'solution.py')
      fs.writeFileSync(srcPath, src, 'utf-8')
      try {
        execSync(`python -m py_compile "${srcPath}"`, {
          timeout: COMPILE_TIMEOUT,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        return null
      } catch (e: any) {
        return e.stderr || e.message || '编译失败'
      }
    },
    async run(workDir, input, timeLimit) {
      return runProcess('python', [path.join(workDir, 'solution.py')], workDir, input, timeLimit)
    },
  },
}

function runProcess(
  command: string,
  args: string[],
  cwd: string,
  input: string,
  timeLimitMs: number
): Promise<{ stdout: string; stderr: string; runtime: number; exitCode: number; signal: string | null }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const proc = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', LANG: 'en_US.UTF-8' },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      resolve({ stdout, stderr, runtime: timeLimitMs + 100, exitCode: -1, signal: 'SIGKILL' })
    }, timeLimitMs + 1000)

    proc.on('close', (code, signal) => {
      clearTimeout(timer)
      const runtime = Date.now() - start
      resolve({ stdout, stderr, runtime, exitCode: code ?? -1, signal })
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      const runtime = Date.now() - start
      resolve({ stdout, stderr: err.message, runtime, exitCode: -1, signal: null })
    })

    proc.stdin.write(input)
    proc.stdin.end()
  })
}

function compareOutput(actual: string, expected: string): boolean {
  const normalize = (s: string) => s.replace(/\r\n/g, '\n').trimEnd()
  return normalize(actual) === normalize(expected)
}

export async function localJudge(
  src: string,
  language: string,
  timeLimitMs: number,
  _memoryLimitMB: number,
  testCases: Array<{ input: string; output: string }>
): Promise<JudgeResult> {
  const lang = language.toLowerCase()
  const config = LANG_CONFIG[lang]

  if (!config) {
    return { status: 'compilation_error', runtime: null, memory: null, errorMessage: `不支持的语言: ${language}` }
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oj-judge-'))
  try {
    // Compile
    const compileError = config.compile(src, workDir)
    if (compileError) {
      return { status: 'compilation_error', runtime: null, memory: null, errorMessage: compileError }
    }

    // Run test cases
    let worstStatus: JudgeResult['status'] = 'accepted'
    let peakRuntime = 0

    for (const tc of testCases) {
      const input = tc.input.endsWith('\n') ? tc.input : tc.input + '\n'
      const expected = tc.output.endsWith('\n') ? tc.output : tc.output + '\n'

      const result = await config.run(workDir, input, timeLimitMs)
      peakRuntime = Math.max(peakRuntime, result.runtime)

      if (result.signal === 'SIGKILL' || result.runtime > timeLimitMs) {
        if (worstStatus === 'accepted') worstStatus = 'time_limit_exceeded'
      } else if (result.exitCode !== 0) {
        if (worstStatus === 'accepted') worstStatus = 'runtime_error'
      } else if (!compareOutput(result.stdout, expected)) {
        if (worstStatus === 'accepted') worstStatus = 'wrong_answer'
      }

      // Stop on first non-TLE error (TLE might be fixed by optimization)
      if (worstStatus === 'wrong_answer' || worstStatus === 'runtime_error') break
    }

    return { status: worstStatus, runtime: peakRuntime, memory: null, errorMessage: null }
  } catch (err: any) {
    logger.error('Local judge error', err)
    return { status: 'system_error', runtime: null, memory: null, errorMessage: err.message || '评测系统错误' }
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true })
  }
}

export function isLocalJudgeAvailable(language: string): boolean {
  const commands: Record<string, string> = {
    cpp: 'g++',
    c: 'gcc',
    java: 'javac',
    python: 'python',
  }
  const cmd = commands[language.toLowerCase()]
  if (!cmd) return false
  try {
    execSync(`${cmd} --version 2>&1 || ${cmd} -version 2>&1`, { stdio: 'pipe', timeout: 5000 })
    return true
  } catch {
    return false
  }
}
