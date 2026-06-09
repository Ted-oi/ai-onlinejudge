import { useState, useRef, useCallback } from 'react'
import { Button, Select, Typography, message, Tooltip, Tabs } from 'antd'
import {
  PlayCircleOutlined,
  ClearOutlined,
  UndoOutlined,
  FontSizeOutlined,
  CopyOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import MonacoEditor from '@monaco-editor/react'
import { useTheme } from '../../components/common/ThemeSwitcher'
import playgroundService from '../../services/playground.service'

const { Text } = Typography

const TEMPLATES: Record<string, { code: string; lang: string }> = {
  cpp: {
    lang: 'cpp',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // 输入示例：直接读取 stdin
    int n;
    cin >> n;
    cout << "Hello, Playground! n = " << n << endl;
    return 0;
}`,
  },
  c: {
    lang: 'c',
    code: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("Hello, Playground! n = %d\\n", n);
    return 0;
}`,
  },
  python: {
    lang: 'python',
    code: `# Python Playground
n = int(input())
print(f"Hello, Playground! n = {n}")`,
  },
  java: {
    lang: 'java',
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println("Hello, Playground! n = " + n);
    }
}`,
  },
}

const LANG_OPTIONS = [
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
]

const Playground = () => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [language, setLanguage] = useState('cpp')
  const [code, setCode] = useState(TEMPLATES.cpp.code)
  const [stdin, setStdin] = useState('')
  const [result, setResult] = useState<{
    status: string
    stdout: string
    stderr: string
    runtime: number
  } | null>(null)
  const [running, setRunning] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [fullscreen, setFullscreen] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  const handleLangChange = useCallback((lang: string) => {
    setLanguage(lang)
    setCode(TEMPLATES[lang]?.code || '')
    setResult(null)
  }, [])

  const handleRun = async () => {
    if (!code.trim()) {
      message.warning('请输入代码')
      return
    }
    setRunning(true)
    setResult(null)
    try {
      const res = await playgroundService.executeCode({
        code,
        language,
        input: stdin,
        timeLimit: 5000,
      })
      setResult(res.data)
    } catch {
      message.error('执行失败，请检查后端服务')
    } finally {
      setRunning(false)
    }
  }

  const handleReset = () => {
    setCode(TEMPLATES[language]?.code || '')
    setStdin('')
    setResult(null)
  }

  const handleCopyOutput = () => {
    if (result?.stdout) {
      navigator.clipboard.writeText(result.stdout)
      message.success('已复制输出')
    }
  }

  const panelBg = isDark ? '#1a1a1a' : '#fafafa'
  const panelBorder = isDark ? '#333' : '#e8e8e8'
  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const textSecondary = isDark ? 'rgba(255,255,255,0.45)' : '#8c8c8c'

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
        display: 'flex', background: isDark ? '#141414' : '#fff',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${panelBorder}` }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', alignItems: 'center', gap: 8, background: panelBg }}>
            <Select value={language} onChange={handleLangChange} options={LANG_OPTIONS} style={{ width: 120 }} size="small" />
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleRun} loading={running} size="small">
              运行
            </Button>
            <Button icon={<UndoOutlined />} onClick={handleReset} size="small">重置</Button>
            <Button icon={<FullscreenExitOutlined />} onClick={() => setFullscreen(false)} size="small" style={{ marginLeft: 'auto' }}>
              退出全屏
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <MonacoEditor
              height="100%"
              language={TEMPLATES[language]?.lang || 'plaintext'}
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize,
                fontFamily: 'Consolas, "Courier New", monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8 },
              }}
            />
          </div>
        </div>
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', background: panelBg }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${panelBorder}`, fontWeight: 600, fontSize: 13, color: textSecondary }}>
            标准输入
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="在此输入 stdin 数据..."
            style={{
              height: 120, padding: 8, border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'Consolas, monospace', fontSize: 13, background: 'transparent',
              color: isDark ? '#e0e0e0' : '#333',
            }}
          />
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${panelBorder}`, borderBottom: `1px solid ${panelBorder}`, fontWeight: 600, fontSize: 13, color: textSecondary }}>
            输出
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8, fontFamily: 'Consolas, monospace', fontSize: 13, whiteSpace: 'pre-wrap', color: isDark ? '#e0e0e0' : '#333' }}>
            {running ? <Text type="secondary">运行中...</Text> : result ? (
              result.status === 'compilation_error' ? (
                <Text type="danger">{result.stderr}</Text>
              ) : (
                <>
                  {result.stdout || <Text type="secondary">(无输出)</Text>}
                  {result.stderr && <Text type="warning" style={{ display: 'block', marginTop: 8 }}>stderr:\n{result.stderr}</Text>}
                  <div style={{ marginTop: 8, borderTop: `1px solid ${panelBorder}`, paddingTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {result.runtime}ms · {result.status === 'time_limit_exceeded' ? '超时' : result.status === 'runtime_error' ? '运行错误' : '运行完成'}
                    </Text>
                  </div>
                </>
              )
            ) : <Text type="secondary">点击「运行」查看输出</Text>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        <Text strong style={{ fontSize: 18, color: isDark ? '#e0e0e0' : '#1a1a2e' }}>
          代码 Playground
        </Text>
        <div style={{ flex: 1 }} />
        <Select value={language} onChange={handleLangChange} options={LANG_OPTIONS} style={{ width: 120 }} />
        <Select
          value={fontSize}
          onChange={setFontSize}
          style={{ width: 90 }}
          options={[
            { value: 12, label: '12px' },
            { value: 14, label: '14px' },
            { value: 16, label: '16px' },
            { value: 18, label: '18px' },
          ]}
          suffixIcon={<FontSizeOutlined />}
        />
        <Tooltip title="全屏模式">
          <Button icon={<FullscreenOutlined />} onClick={() => setFullscreen(true)} />
        </Tooltip>
        <Button icon={<ClearOutlined />} onClick={() => setCode('')}>清空</Button>
        <Button icon={<UndoOutlined />} onClick={handleReset}>重置模板</Button>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleRun} loading={running} size="large">
          运行
        </Button>
      </div>

      {/* Main area: left editor, right panel */}
      <div style={{ display: 'flex', gap: 16, minHeight: 520, flexDirection: 'row' }}>
        {/* Editor */}
        <div style={{
          flex: 1, minWidth: 0, border: `1px solid ${panelBorder}`, borderRadius: 8, overflow: 'hidden',
        }}>
          <MonacoEditor
            height="520px"
            language={TEMPLATES[language]?.lang || 'plaintext'}
            theme={isDark ? 'vs-dark' : 'light'}
            value={code}
            onChange={(v) => setCode(v || '')}
            options={{
              minimap: { enabled: false },
              fontSize,
              fontFamily: 'Consolas, "Courier New", monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        </div>

        {/* Right panel */}
        <div style={{
          width: 360, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0,
        }}>
          {/* Stdin */}
          <div style={{
            border: `1px solid ${panelBorder}`, borderRadius: 8, overflow: 'hidden',
            background: cardBg, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '8px 12px', borderBottom: `1px solid ${panelBorder}`,
              fontWeight: 600, fontSize: 13, color: textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              标准输入 (stdin)
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="在此输入 stdin 数据..."
              style={{
                height: 100, padding: '8px 12px', border: 'none', outline: 'none', resize: 'vertical',
                fontFamily: 'Consolas, monospace', fontSize: 13, background: 'transparent',
                color: isDark ? '#e0e0e0' : '#333',
              }}
            />
          </div>

          {/* Output */}
          <div ref={outputRef} style={{
            flex: 1, border: `1px solid ${panelBorder}`, borderRadius: 8, overflow: 'hidden',
            background: cardBg, display: 'flex', flexDirection: 'column', minHeight: 300,
          }}>
            <div style={{
              padding: '8px 12px', borderBottom: `1px solid ${panelBorder}`,
              fontWeight: 600, fontSize: 13, color: textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>输出</span>
              {result?.stdout && (
                <Tooltip title="复制输出">
                  <CopyOutlined style={{ cursor: 'pointer' }} onClick={handleCopyOutput} />
                </Tooltip>
              )}
            </div>
            <div style={{
              flex: 1, overflow: 'auto', padding: '8px 12px',
              fontFamily: 'Consolas, monospace', fontSize: 13, whiteSpace: 'pre-wrap',
              color: isDark ? '#e0e0e0' : '#333',
            }}>
              {running ? (
                <Text type="secondary">运行中...</Text>
              ) : result ? (
                <Tabs
                  size="small"
                  items={[
                    {
                      key: 'stdout',
                      label: '输出',
                      children: result.stdout || <Text type="secondary">(无输出)</Text>,
                    },
                    {
                      key: 'stderr',
                      label: `错误${result.stderr ? ` (${result.stderr.split('\n').length}行)` : ''}`,
                      children: result.stderr ? (
                        <Text type="danger" style={{ whiteSpace: 'pre-wrap' }}>{result.stderr}</Text>
                      ) : <Text type="secondary">(无错误)</Text>,
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">点击「运行」查看输出</Text>
              )}
            </div>
            {result && (
              <div style={{
                padding: '6px 12px', borderTop: `1px solid ${panelBorder}`,
                display: 'flex', justifyContent: 'space-between', fontSize: 12,
                color: textSecondary,
              }}>
                <span>
                  {result.status === 'compilation_error' ? '编译错误' :
                   result.status === 'time_limit_exceeded' ? '运行超时' :
                   result.status === 'runtime_error' ? '运行错误' : '运行完成'}
                </span>
                <span>{result.runtime}ms</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Playground
