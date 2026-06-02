import { useState, useEffect } from 'react'
import { Form, Input, Select, InputNumber, Button, Card, Tabs, Space, Radio, message, Spin } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { problemService } from '../../services/problem.service'
import { PROBLEM_CATEGORIES, SECTION_TITLES } from '../../types/problem'
import TestCaseManager from '../problems/TestCaseManager'

const { TextArea } = Input

const AdminProblemForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [problemType, setProblemType] = useState<string>('coding')

  useEffect(() => {
    if (isEdit) loadProblem()
  }, [id])

  const loadProblem = async () => {
    setLoading(true)
    try {
      const problem = await problemService.getProblemById(Number(id))
      const pt = problem.problem_type || 'coding'
      setProblemType(pt === 'objective' ? (problem.objective_data?.type || 'choice') : 'coding')
      form.setFieldsValue({
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        categories: problem.categories || (problem.category ? [problem.category] : []),
        time_limit: problem.time_limit,
        memory_limit: problem.memory_limit,
        examples: Array.isArray(problem.examples) && problem.examples.length > 0
          ? problem.examples : [{ input: '', output: '', explanation: '' }],
        problem_type: pt,
        objective_data: problem.objective_data || {
          type: 'choice', options: ['', '', '', ''], answer: 0,
        },
      })
    } catch {} finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const pt = values.problem_type || 'coding'
      let objective_data = undefined

      if (pt === 'choice') {
        const opts = values.objective_data?.options?.filter((o: string) => o?.trim()) || []
        if (opts.length < 2) { message.error('单选题至少需要 2 个选项'); setSaving(false); return }
        objective_data = { type: 'choice', options: opts, answer: values.objective_data?.answer ?? 0 }
      } else if (pt === 'judge') {
        objective_data = { type: 'judge', answer: values.objective_data?.answer ?? true }
      }

      const data = {
        ...values,
        category: values.categories?.[0] || '',
        problem_type: pt === 'choice' || pt === 'judge' ? 'objective' : 'coding',
        objective_data,
        ...(pt !== 'coding' ? { time_limit: 0, memory_limit: 0, examples: [] } : {}),
      }

      if (isEdit) {
        await problemService.updateProblem(Number(id), data)
        message.success('更新成功')
      } else {
        const newProblem = await problemService.createProblem(data)
        message.success('创建成功')
        navigate(`/admin/problems/${newProblem.id}/edit`)
        return
      }
    } catch (error: any) {
      if (error?.errorFields) return
    } finally { setSaving(false) }
  }

  const groupedCategories = Object.entries(SECTION_TITLES).map(([section, label]) => ({
    label,
    options: PROBLEM_CATEGORIES.filter(c => c.section === section).map(c => ({
      label: c.name, value: c.id,
    })),
  }))

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  const isObjective = problemType !== 'coding'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/problems')} style={{ marginRight: 16 }}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑题目' : '创建题目'}</h2>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'basic',
          label: '基本信息',
          children: (
            <Form form={form} layout="vertical" initialValues={{
              difficulty: 'easy', time_limit: 1000, memory_limit: 256,
              examples: [{ input: '', output: '', explanation: '' }],
              problem_type: 'coding',
              objective_data: { type: 'choice', options: ['', '', '', ''], answer: 0 },
            }}>
              <Form.Item name="problem_type" label="题目类型" rules={[{ required: true }]}>
                <Select onChange={(v: string) => setProblemType(v)} options={[
                  { label: '编程题', value: 'coding' },
                  { label: '单选题', value: 'choice' },
                  { label: '判断题', value: 'judge' },
                ]} style={{ width: 200 }} />
              </Form.Item>

              <Form.Item name="title" label="题目标题" rules={[{ required: true, message: '请输入标题' }]}>
                <Input placeholder="例：A+B Problem" />
              </Form.Item>

              <Form.Item name="description" label="题目描述" rules={[{ required: true, message: '请输入描述' }]}>
                <TextArea rows={8} placeholder="支持 Markdown 格式" />
              </Form.Item>

              <Space size="large" style={{ width: '100%' }}>
                <Form.Item name="difficulty" label="难度" rules={[{ required: true }]}>
                  <Select style={{ width: 150 }} options={[
                    { label: '简单', value: 'easy' },
                    { label: '中等', value: 'medium' },
                    { label: '困难', value: 'hard' },
                  ]} />
                </Form.Item>

                <Form.Item name="categories" label="分类标签">
                  <Select mode="multiple" placeholder="选择分类" options={groupedCategories}
                    optionFilterProp="label" style={{ width: 400 }} maxCount={3} />
                </Form.Item>
              </Space>

              {/* Objective: Choice options */}
              {problemType === 'choice' && (
                <Card title="选项设置" size="small" style={{ marginBottom: 24 }}>
                  <Form.List name={['objective_data', 'options']}>
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map((field, index) => (
                          <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <Form.Item name={[field.name]} noStyle rules={[{ required: true, message: '请输入选项内容' }]}>
                              <Input placeholder={`选项 ${String.fromCharCode(65 + index)}`} style={{ flex: 1 }} />
                            </Form.Item>
                            <Form.Item name={['objective_data', 'answer']} noStyle>
                              <Radio
                                value={index}
                                checked={form.getFieldValue(['objective_data', 'answer']) === index}
                                onChange={() => {
                                  form.setFieldValue(['objective_data', 'answer'], index)
                                }}
                              >
                                正确
                              </Radio>
                            </Form.Item>
                            {fields.length > 2 && (
                              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                            )}
                          </div>
                        ))}
                        {fields.length < 8 && (
                          <Button type="dashed" onClick={() => add('')} icon={<PlusOutlined />}>
                            添加选项
                          </Button>
                        )}
                      </>
                    )}
                  </Form.List>
                </Card>
              )}

              {/* Objective: Judge answer */}
              {problemType === 'judge' && (
                <Card title="正确答案" size="small" style={{ marginBottom: 24 }}>
                  <Form.Item name={['objective_data', 'answer']} rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio value={true}>正确</Radio>
                      <Radio value={false}>错误</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Card>
              )}

              {/* Coding-only fields */}
              {!isObjective && (
                <>
                  <Space size="large" style={{ width: '100%' }}>
                    <Form.Item name="time_limit" label="时间限制 (ms)" rules={[{ required: true }]}>
                      <InputNumber min={100} max={30000} step={100} />
                    </Form.Item>
                    <Form.Item name="memory_limit" label="内存限制 (MB)" rules={[{ required: true }]}>
                      <InputNumber min={16} max={1024} step={16} />
                    </Form.Item>
                  </Space>

                  <Card title="样例数据" size="small" style={{ marginBottom: 24 }}>
                    <Form.List name="examples">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field, index) => (
                            <Card key={field.key} size="small" style={{ marginBottom: 12 }}
                              title={`样例 ${index + 1}`}
                              extra={fields.length > 1 ? <Button type="link" danger size="small" onClick={() => remove(field.name)}>删除</Button> : null}>
                              <Form.Item name={[field.name, 'input']} label="输入" style={{ marginBottom: 8 }}>
                                <TextArea rows={3} style={{ fontFamily: 'monospace' }} />
                              </Form.Item>
                              <Form.Item name={[field.name, 'output']} label="输出" style={{ marginBottom: 8 }}>
                                <TextArea rows={3} style={{ fontFamily: 'monospace' }} />
                              </Form.Item>
                              <Form.Item name={[field.name, 'explanation']} label="说明" style={{ marginBottom: 0 }}>
                                <TextArea rows={2} />
                              </Form.Item>
                            </Card>
                          ))}
                          <Button type="dashed" onClick={() => add({ input: '', output: '', explanation: '' })} block>
                            + 添加样例
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Card>
                </>
              )}

              <Form.Item>
                <Space>
                  <Button type="primary" onClick={handleSubmit} loading={saving}>
                    {isEdit ? '保存修改' : '创建题目'}
                  </Button>
                  <Button onClick={() => navigate('/admin/problems')}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          ),
        },
        {
          key: 'testcases',
          label: '测试用例',
          disabled: !isEdit || isObjective,
          children: isEdit && !isObjective ? (
            <TestCaseManager problemId={Number(id)} />
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              {isObjective ? '客观题不需要测试用例' : '请先保存题目基本信息后再管理测试用例'}
            </div>
          ),
        },
      ]} />
    </div>
  )
}

export default AdminProblemForm
