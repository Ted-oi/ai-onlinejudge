import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Select, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { problemService } from '../../services/problem.service'
import { submissionService } from '../../services/submission.service'
import type { Problem } from '../../types'
import MonacoEditor from '@monaco-editor/react'

const { Title } = Typography

const ProblemSubmit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('cpp')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProblem()
    }
  }, [id])

  const fetchProblem = async () => {
    try {
      setLoading(true)
      const data = await problemService.getProblemById(Number(id))
      setProblem(data)
      setCode(getDefaultCode(language))
    } catch (error) {
      message.error('获取题目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultCode = (lang: string) => {
    const templates: any = {
      cpp: `#include <iostream>
using namespace std;

int main() {
    // 在这里编写你的代码
    return 0;
}`,
      java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 在这里编写你的代码
    }
}`,
      python: `# 在这里编写你的代码
if __name__ == "__main__":
    pass`,
    }
    return templates[lang] || ''
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setCode(getDefaultCode(newLanguage))
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      message.error('请输入代码')
      return
    }

    try {
      setSubmitting(true)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const submission = await submissionService.createSubmission({
        problem_id: Number(id),
        user_id: user.id,
        language,
        code,
      })
      message.success('提交成功')
      navigate(`/submissions/${submission.id}`)
    } catch (error) {
      message.error('提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const languages = [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
  ]

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

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Text strong>选择编程语言：</Typography.Text>
          <Select
            value={language}
            onChange={handleLanguageChange}
            style={{ width: 140 }}
            options={languages}
          />
        </div>

        <div style={{ height: '500px', marginBottom: 16 }}>
          <MonacoEditor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
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