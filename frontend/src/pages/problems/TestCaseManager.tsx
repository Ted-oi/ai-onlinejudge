import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Switch, Space, Tag, Popconfirm, message, Upload, Card } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, InboxOutlined } from '@ant-design/icons'
import api from '../../services/api'

interface TestCase {
  id: number
  problem_id: number
  input: string
  output: string
  is_sample: boolean
  created_at: string
}

interface Props {
  problemId: number
}

const TestCaseManager = ({ problemId }: Props) => {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTestCases()
  }, [problemId])

  const fetchTestCases = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/problems/${problemId}/test-cases`)
      setTestCases(response.data.data.test_cases)
    } catch {
      message.error('获取测试用例失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCase(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: TestCase) => {
    setEditingCase(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingCase) {
        await api.put(`/problems/${problemId}/test-cases/${editingCase.id}`, values)
        message.success('更新成功')
      } else {
        await api.post(`/problems/${problemId}/test-cases`, values)
        message.success('添加成功')
      }
      setModalOpen(false)
      fetchTestCases()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (caseId: number) => {
    try {
      await api.delete(`/problems/${problemId}/test-cases/${caseId}`)
      message.success('删除成功')
      fetchTestCases()
    } catch {
      message.error('删除失败')
    }
  }

  const handleBatchImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const cases: Array<{ input: string; output: string; is_sample: boolean }> = []
        let current: { input: string; output: string } | null = null
        let mode: 'input' | 'output' = 'input'

        for (const line of lines) {
          if (line.trim() === '---') {
            if (current && current.input) {
              cases.push({ ...current, is_sample: false })
            }
            current = { input: '', output: '' }
            mode = 'input'
          } else if (line.trim() === '===') {
            mode = 'output'
          } else if (current) {
            if (mode === 'input') {
              current.input += (current.input ? '\n' : '') + line
            } else {
              current.output += (current.output ? '\n' : '') + line
            }
          }
        }
        if (current && current.input) {
          cases.push({ ...current, is_sample: false })
        }

        if (cases.length === 0) {
          message.warning('未能解析出测试用例。格式：输入用===分隔输入输出，---分隔不同用例')
          return
        }

        await api.post(`/problems/${problemId}/test-cases/batch`, { test_cases: cases })
        message.success(`成功导入 ${cases.length} 个测试用例`)
        fetchTestCases()
      } catch {
        message.error('导入失败')
      }
    }
    reader.readAsText(file)
    return false
  }

  const handleFileUpload = async (files: File[]) => {
    setUploading(true)
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    try {
      const res = await api.post(`/problems/${problemId}/test-cases/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      message.success(`成功导入 ${res.data.data.count} 个测试用例`)
      fetchTestCases()
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || '上传失败'
      message.error(msg)
    } finally {
      setUploading(false)
    }
    return false
  }

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '类型',
      dataIndex: 'is_sample',
      key: 'is_sample',
      width: 80,
      render: (is_sample: boolean) => (
        <Tag color={is_sample ? 'blue' : 'default'}>{is_sample ? '样例' : '测试'}</Tag>
      ),
    },
    {
      title: '输入',
      dataIndex: 'input',
      key: 'input',
      ellipsis: true,
      render: (text: string) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto', fontSize: 12 }}>{text}</pre>
      ),
    },
    {
      title: '输出',
      dataIndex: 'output',
      key: 'output',
      ellipsis: true,
      render: (text: string) => (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'auto', fontSize: 12 }}>{text}</pre>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: TestCase) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加测试用例
        </Button>
        <Upload accept=".txt,.in" showUploadList={false} beforeUpload={handleBatchImport}>
          <Button icon={<UploadOutlined />}>文本导入</Button>
        </Upload>
        <Tag>共 {testCases.length} 个用例</Tag>
      </Space>

      <Card
        size="small"
        style={{ marginBottom: 16, borderColor: '#1890ff' }}
      >
        <Upload.Dragger
          multiple
          accept=".in,.out,.ans,.zip"
          showUploadList={false}
          beforeUpload={(file, fileList) => {
            // only trigger once for the batch
            if (fileList.indexOf(file) === 0) {
              handleFileUpload(fileList)
            }
            return false
          }}
          disabled={uploading}
        >
          <p style={{ marginBottom: 8 }}>
            {uploading ? '上传中...' : <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
          </p>
          <p style={{ marginBottom: 4 }}>
            <strong>点击或拖拽上传测试数据文件</strong>
          </p>
          <p style={{ color: '#999', fontSize: 12, marginBottom: 0 }}>
            支持 .in / .out / .ans 文件，或包含这些文件的 .zip 压缩包
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            文件名需配对：如 1.in + 1.out、data2.in + data2.out
          </p>
        </Upload.Dragger>
      </Card>

      <Table
        columns={columns}
        dataSource={testCases}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title={editingCase ? '编辑测试用例' : '添加测试用例'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="input" label="输入" rules={[{ required: true, message: '请输入测试输入' }]}>
            <Input.TextArea rows={6} placeholder="测试输入数据" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="output" label="输出" rules={[{ required: true, message: '请输入期望输出' }]}>
            <Input.TextArea rows={6} placeholder="期望输出数据" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="is_sample" label="样例数据" valuePropName="checked">
            <Switch checkedChildren="样例" unCheckedChildren="测试" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TestCaseManager
