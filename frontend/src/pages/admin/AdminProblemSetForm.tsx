import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, Space, message, Modal, Table, Tag, List, Typography } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import problemSetService from '../../services/problemSet.service'
import { problemService } from '../../services/problem.service'
import { PROBLEM_SET_CATEGORIES } from '../../types/problemSet'
import type { Problem } from '../../types'

const { Title, Text } = Typography

const AdminProblemSetForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [problemIds, setProblemIds] = useState<number[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [allProblems, setAllProblems] = useState<Problem[]>([])
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
  const [searchText, setSearchText] = useState('')
  const [addedProblems, setAddedProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) loadProblemSet()
    loadAllProblems()
  }, [id])

  useEffect(() => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      setFilteredProblems(allProblems.filter(p =>
        p.title.toLowerCase().includes(q) || String(p.id).includes(q)
      ))
    } else {
      setFilteredProblems(allProblems.slice(0, 50))
    }
  }, [searchText, allProblems])

  const loadProblemSet = async () => {
    try {
      setLoading(true)
      const data = await problemSetService.getProblemSetById(Number(id))
      const ps = data.problemSet
      form.setFieldsValue({
        title: ps.title,
        description: ps.description,
        category: ps.category,
        difficulty: ps.difficulty,
        cover_color: ps.cover_color,
      })
      setProblemIds(ps.problem_ids || [])
      setAddedProblems(data.problems || [])
    } finally {
      setLoading(false)
    }
  }

  const loadAllProblems = async () => {
    try {
      const data = await problemService.getProblems({ limit: 500 })
      setAllProblems(data.problems)
      setFilteredProblems(data.problems.slice(0, 50))
    } catch { /* ignore */ }
  }

  const handleAddProblem = (problem: Problem) => {
    if (problemIds.includes(problem.id)) return
    const newIds = [...problemIds, problem.id]
    setProblemIds(newIds)
    setAddedProblems(prev => [...prev, problem])
  }

  const handleRemoveProblem = (pid: number) => {
    setProblemIds(prev => prev.filter(id => id !== pid))
    setAddedProblems(prev => prev.filter(p => p.id !== pid))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newIds = [...problemIds]
    const newProblems = [...addedProblems]
    ;[newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]]
    ;[newProblems[index - 1], newProblems[index]] = [newProblems[index], newProblems[index - 1]]
    setProblemIds(newIds)
    setAddedProblems(newProblems)
  }

  const handleMoveDown = (index: number) => {
    if (index === problemIds.length - 1) return
    const newIds = [...problemIds]
    const newProblems = [...addedProblems]
    ;[newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]]
    ;[newProblems[index], newProblems[index + 1]] = [newProblems[index + 1], newProblems[index]]
    setProblemIds(newIds)
    setAddedProblems(newProblems)
  }

  const handleSave = async (publish: boolean) => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      const payload = {
        ...values,
        problem_ids: problemIds,
        is_published: publish,
      }

      if (isEdit) {
        await problemSetService.updateProblemSet(Number(id), payload)
        message.success(publish ? '已发布' : '保存成功')
      } else {
        await problemSetService.createProblemSet(payload)
        message.success(publish ? '已创建并发布' : '创建成功')
      }
      navigate('/admin/problem-sets')
    } catch {
      message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const diffColors: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
  const diffLabels: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }

  const modalColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      render: (id: number) => {
        const pno = allProblems.find(p => p.id === id)
        return pno ? `P${String(id).padStart(4, '0')}` : id
      },
    },
    { title: '标题', dataIndex: 'title' },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (d: string) => <Tag color={diffColors[d]}>{diffLabels[d] || d}</Tag>,
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: Problem) => (
        <Button
          type="link"
          size="small"
          disabled={problemIds.includes(record.id)}
          onClick={() => handleAddProblem(record)}
        >
          {problemIds.includes(record.id) ? '已添加' : '添加'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/problem-sets')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card loading={loading}>
        <Title level={3}>{isEdit ? '编辑题单' : '创建题单'}</Title>

        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="题单标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="题单描述" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="category" label="分类" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select options={PROBLEM_SET_CATEGORIES.map(c => ({ label: c.label, value: c.value }))} />
            </Form.Item>
            <Form.Item name="difficulty" label="难度" style={{ width: 140 }}>
              <Select options={[
                { label: '简单', value: 'easy' },
                { label: '中等', value: 'medium' },
                { label: '困难', value: 'hard' },
                { label: '混合', value: 'mixed' },
              ]} />
            </Form.Item>
            <Form.Item name="cover_color" label="封面颜色" style={{ width: 100 }}>
              <Input type="color" style={{ height: 32, padding: 2 }} />
            </Form.Item>
          </Space>
        </Form>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>题目列表 ({problemIds.length})</Title>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              添加题目
            </Button>
          </div>

          {addedProblems.length === 0 ? (
            <Text type="secondary">暂未添加题目，点击"添加题目"开始</Text>
          ) : (
            <List
              size="small"
              bordered
              dataSource={addedProblems}
              renderItem={(problem, index) => (
                <List.Item
                  actions={[
                    <Button key="up" type="link" size="small" disabled={index === 0} onClick={() => handleMoveUp(index)}>上移</Button>,
                    <Button key="down" type="link" size="small" disabled={index === addedProblems.length - 1} onClick={() => handleMoveDown(index)}>下移</Button>,
                    <Button key="del" type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveProblem(problem.id)} />,
                  ]}
                >
                  <Space>
                    <Text type="secondary">{index + 1}.</Text>
                    <Text>{problem.title}</Text>
                    <Tag color={diffColors[problem.difficulty]} style={{ fontSize: 11 }}>
                      {diffLabels[problem.difficulty] || problem.difficulty}
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button onClick={() => handleSave(false)} loading={saving}>
            保存草稿
          </Button>
          <Button type="primary" onClick={() => handleSave(true)} loading={saving}>
            {isEdit ? '保存并发布' : '创建并发布'}
          </Button>
        </div>
      </Card>

      <Modal
        title="添加题目"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={700}
        footer={null}
      >
        <Input
          placeholder="搜索题目（ID 或标题）"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Table
          columns={modalColumns}
          dataSource={filteredProblems}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  )
}

export default AdminProblemSetForm
