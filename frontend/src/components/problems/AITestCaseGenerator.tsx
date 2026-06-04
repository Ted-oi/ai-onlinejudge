import { useState } from 'react'
import { Button, Table, Checkbox, Space, message, Card, Typography, Tag } from 'antd'
import { RobotOutlined, LoadingOutlined, SaveOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface GeneratedCase {
  input: string
  output: string
  description: string
}

interface Props {
  problemId: number
  onSaved: () => void
}

const AITestCaseGenerator = ({ problemId, onSaved }: Props) => {
  const [generating, setGenerating] = useState(false)
  const [cases, setCases] = useState<GeneratedCase[]>([])
  const [selectedKeys, setSelectedKeys] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setCases([])
    setSelectedKeys([])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/problems/${problemId}/generate-test-cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || '生成失败')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.substring(6).trim()
          try {
            const parsed = JSON.parse(data)
            if (parsed.done && parsed.cases) {
              const validCases = parsed.cases.filter((c: GeneratedCase) => c.input && c.output)
              setCases(validCases)
              setSelectedKeys(validCases.map((_: GeneratedCase, i: number) => i))
            }
            if (parsed.error) {
              message.error(parsed.error)
            }
          } catch {
            // skip
          }
        }
      }
    } catch (error: any) {
      message.error(error.message || 'AI 生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (selectedKeys.length === 0) {
      message.warning('请至少选择一个测试用例')
      return
    }

    setSaving(true)
    try {
      const selectedCases = selectedKeys.map(i => ({
        input: cases[i].input,
        output: cases[i].output,
        is_sample: false,
      }))

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/problems/${problemId}/test-cases/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_cases: selectedCases }),
      })

      const data = await response.json()
      if (data.success) {
        message.success(`成功保存 ${selectedCases.length} 个测试用例`)
        setCases([])
        setSelectedKeys([])
        onSaved()
      } else {
        throw new Error(data.error?.message || '保存失败')
      }
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: '选择',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Checkbox
          checked={selectedKeys.includes(index)}
          onChange={(e) => {
            setSelectedKeys(prev =>
              e.target.checked
                ? [...prev, index]
                : prev.filter(k => k !== index)
            )
          }}
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'description',
      width: 150,
      ellipsis: true,
      render: (text: string) => <Tag>{text || '测试用例'}</Tag>,
    },
    {
      title: '输入',
      dataIndex: 'input',
      ellipsis: true,
      render: (text: string) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto', fontSize: 12 }}>
          {text}
        </pre>
      ),
    },
    {
      title: '输出',
      dataIndex: 'output',
      ellipsis: true,
      render: (text: string) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto', fontSize: 12 }}>
          {text}
        </pre>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={generating ? <LoadingOutlined /> : <RobotOutlined />}
          onClick={handleGenerate}
          loading={generating}
        >
          {generating ? 'AI 生成中...' : 'AI 生成测试用例'}
        </Button>
        {generating && (
          <Text type="secondary">AI 正在分析题目并生成测试数据，请稍候...</Text>
        )}
      </Space>

      {cases.length > 0 && (
        <Card
          size="small"
          title={
            <Space>
              <Text strong>AI 生成的测试用例</Text>
              <Tag color="blue">{cases.length} 个</Tag>
              <Text type="secondary">已选 {selectedKeys.length} 个</Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={selectedKeys.length === 0}
            >
              保存所选 ({selectedKeys.length})
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={cases}
            rowKey={(_, index) => String(index)}
            pagination={false}
            size="small"
          />
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
            请仔细检查生成的测试用例是否正确，勾选需要保存的用例后点击"保存所选"。
          </Paragraph>
        </Card>
      )}
    </div>
  )
}

export default AITestCaseGenerator
