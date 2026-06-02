import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Button, Typography, Select, message, Space } from 'antd'
import { ArrowLeftOutlined, FontSizeOutlined } from '@ant-design/icons'
import { problemService } from '../../services/problem.service'
import { submissionService } from '../../services/submission.service'
import type { Problem } from '../../types'
import MonacoEditor from '@monaco-editor/react'
import { useTheme } from '../../components/common/ThemeSwitcher'

const { Title } = Typography

const defaultCppCode = `#include <iostream>
using namespace std;

int main() {
    // 在这里编写你的代码
    return 0;
}`

const ProblemSubmit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contestId = searchParams.get('contest_id')
  const { theme } = useTheme()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState(defaultCppCode)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fontSize, setFontSize] = useState(14)

  useEffect(() => {
    if (id) fetchProblem()
  }, [id])

  const fetchProblem = async () => {
    try {
      setLoading(true)
      const data = await problemService.getProblemById(Number(id))
      setProblem(data)
    } catch {
      message.error('获取题目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      message.error('请输入代码')
      return
    }

    try {
      setSubmitting(true)
      const submission = await submissionService.createSubmission({
        problem_id: Number(id),
        language: 'cpp',
        code,
        ...(contestId ? { contest_id: Number(contestId) } : {}),
      })
      message.success('提交成功')
      navigate(`/submissions/${submission.id}`)
    } catch {
      message.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light'

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/problems/${id}`)}
        >
          返回题目
        </Button>
      </div>

      <Card loading={loading}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>{problem?.title}</Title>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontSizeOutlined />
          <Typography.Text>字号</Typography.Text>
          <Select
            value={fontSize}
            onChange={setFontSize}
            style={{ width: 80 }}
            options={[
              { value: 12, label: '12px' },
              { value: 14, label: '14px' },
              { value: 16, label: '16px' },
              { value: 18, label: '18px' },
              { value: 20, label: '20px' },
            ]}
          />
        </div>

        <div style={{
          height: '500px',
          marginBottom: 16,
          border: `1px solid ${theme === 'dark' ? '#303030' : '#d9d9d9'}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <MonacoEditor
            height="100%"
            language="cpp"
            theme={editorTheme}
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize,
              fontFamily: 'Consolas, "Courier New", monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          loading={submitting}
          block
        >
          提交代码
        </Button>
      </Card>
    </div>
  )
}

export default ProblemSubmit
