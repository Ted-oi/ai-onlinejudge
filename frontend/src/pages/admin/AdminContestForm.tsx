import { useState, useEffect } from 'react'
import { Form, Input, DatePicker, Button, Space, Transfer, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import contestService from '../../services/contest.service'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'

const { TextArea } = Input

const AdminContestForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  useEffect(() => {
    loadProblems()
    if (isEdit) loadContest()
  }, [id])

  const loadProblems = async () => {
    try {
      const data = await problemService.getProblems({ limit: 1000 })
      setProblems(data || [])
    } catch {
      // handled
    }
  }

  const loadContest = async () => {
    setLoading(true)
    try {
      const contest = await contestService.getContestById(Number(id))
      form.setFieldsValue({
        title: contest.title,
        description: contest.description,
        time_range: [
          contest.start_time ? new Date(contest.start_time) : null,
          contest.end_time ? new Date(contest.end_time) : null,
        ],
      })
      setSelectedKeys((contest.problem_ids || []).map(String))
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const data = {
        title: values.title,
        description: values.description || '',
        start_time: values.time_range[0].toISOString(),
        end_time: values.time_range[1].toISOString(),
        creator_id: user.id,
        problem_ids: selectedKeys.map(Number),
      }

      if (isEdit) {
        await contestService.updateContest(Number(id), data)
        message.success('更新成功')
      } else {
        await contestService.createContest(data)
        message.success('创建成功')
        navigate('/admin/contests')
        return
      }
    } catch (error: any) {
      if (error?.errorFields) return
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/contests')} style={{ marginRight: 16 }}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑竞赛' : '创建竞赛'}</h2>
      </div>

      <Form form={form} layout="vertical" style={{ maxWidth: 700 }}>
        <Form.Item name="title" label="竞赛标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="例：2026年春季程序设计竞赛" />
        </Form.Item>

        <Form.Item name="description" label="竞赛描述">
          <TextArea rows={4} placeholder="竞赛说明" />
        </Form.Item>

        <Form.Item name="time_range" label="竞赛时间" rules={[{ required: true, message: '请选择时间' }]}>
          <DatePicker.RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="选择题目">
          <Transfer
            dataSource={problems.map(p => ({
              key: String(p.id),
              title: `#${p.id} ${p.title}`,
            }))}
            targetKeys={selectedKeys}
            onChange={(targetKeys) => setSelectedKeys(targetKeys as string[])}
            render={item => item.title || ''}
            listStyle={{ width: 300, height: 400 }}
            showSearch
            filterOption={(input, item) =>
              (item.title || '').toLowerCase().includes(input.toLowerCase())
            }
            titles={['可用题目', '已选题目']}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSubmit} loading={saving}>
              {isEdit ? '保存修改' : '创建竞赛'}
            </Button>
            <Button onClick={() => navigate('/admin/contests')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AdminContestForm
