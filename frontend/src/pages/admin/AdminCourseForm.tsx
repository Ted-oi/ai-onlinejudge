import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Space, Card, message, Spin } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const { TextArea } = Input

const AdminCourseForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  useEffect(() => {
    loadTeachers()
    if (isEdit) loadCourse()
  }, [id])

  const loadTeachers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'teacher', limit: 100 } })
      setTeachers(res.data.data.users || [])
    } catch {
      // handled
    }
  }

  const loadCourse = async () => {
    setLoading(true)
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get(`/courses/${id}/lessons`),
      ])
      const course = courseRes.data.data.course
      form.setFieldsValue({
        title: course.title,
        description: course.description,
        category: course.category,
        instructor_id: course.instructor_id,
      })
      setLessons(lessonsRes.data.data.lessons || [])
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

      if (isEdit) {
        await api.put(`/courses/${id}`, values)
        // Save lessons
        for (const lesson of lessons.filter(l => !l.id)) {
          await api.post('/lessons', { ...lesson, course_id: Number(id) })
        }
        for (const lesson of lessons.filter(l => l.id)) {
          await api.put(`/lessons/${lesson.id}`, lesson)
        }
        message.success('更新成功')
      } else {
        const res = await api.post('/courses', values)
        const newId = res.data.data.course.id
        // Save lessons
        for (const lesson of lessons) {
          await api.post('/lessons', { ...lesson, course_id: newId })
        }
        message.success('创建成功')
        navigate('/admin/courses')
        return
      }
    } catch (error: any) {
      if (error?.errorFields) return
    } finally {
      setSaving(false)
    }
  }

  const addLesson = () => {
    setLessons([...lessons, {
      title: '',
      description: '',
      knowledge_point: '',
      order_index: lessons.length + 1,
    }])
  }

  const updateLesson = (index: number, field: string, value: string) => {
    const updated = [...lessons]
    updated[index] = { ...updated[index], [field]: value }
    setLessons(updated)
  }

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/courses')} style={{ marginRight: 16 }}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>{isEdit ? '编辑课程' : '创建课程'}</h2>
      </div>

      <Form form={form} layout="vertical" style={{ maxWidth: 700 }}>
        <Form.Item name="title" label="课程标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="例：C++程序设计基础" />
        </Form.Item>

        <Form.Item name="description" label="课程描述">
          <TextArea rows={4} />
        </Form.Item>

        <Space size="large" style={{ width: '100%' }}>
          <Form.Item name="category" label="分类">
            <Select style={{ width: 200 }} placeholder="选择分类" allowClear options={[
              { label: '编程语言', value: '编程语言' },
              { label: '算法入门', value: '算法入门' },
              { label: '算法提高', value: '算法提高' },
              { label: '竞赛专题', value: '竞赛专题' },
              { label: '其他', value: '其他' },
            ]} />
          </Form.Item>

          <Form.Item name="instructor_id" label="授课教师">
            <Select style={{ width: 200 }} placeholder="选择教师" allowClear
              options={teachers.map((t: any) => ({ label: t.username, value: t.id }))} />
          </Form.Item>
        </Space>
      </Form>

      <Card
        title="课时列表"
        size="small"
        style={{ marginBottom: 24, maxWidth: 700 }}
        extra={<Button type="link" icon={<PlusOutlined />} onClick={addLesson}>添加课时</Button>}
      >
        {lessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无课时，点击上方按钮添加</div>
        ) : (
          lessons.map((lesson, index) => (
            <Card key={index} size="small" style={{ marginBottom: 8 }}
              title={`课时 ${index + 1}`}
              extra={<Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => removeLesson(index)} />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="课时标题"
                  value={lesson.title}
                  onChange={e => updateLesson(index, 'title', e.target.value)}
                />
                <Input
                  placeholder="知识点"
                  value={lesson.knowledge_point}
                  onChange={e => updateLesson(index, 'knowledge_point', e.target.value)}
                />
                <TextArea
                  rows={2}
                  placeholder="课时描述"
                  value={lesson.description}
                  onChange={e => updateLesson(index, 'description', e.target.value)}
                />
              </Space>
            </Card>
          ))
        )}
      </Card>

      <Space>
        <Button type="primary" onClick={handleSubmit} loading={saving}>
          {isEdit ? '保存修改' : '创建课程'}
        </Button>
        <Button onClick={() => navigate('/admin/courses')}>取消</Button>
      </Space>
    </div>
  )
}

export default AdminCourseForm
