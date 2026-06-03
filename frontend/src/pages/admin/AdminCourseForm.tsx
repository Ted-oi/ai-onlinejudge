import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Space, Card, message, Spin, Upload, List, Tag, Popconfirm } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, VideoCameraOutlined, FileTextOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const { TextArea } = Input

const API_BASE = ''

const AdminCourseForm = () => {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [problemSets, setProblemSets] = useState<any[]>([])

  useEffect(() => {
    loadTeachers()
    loadProblemSets()
    if (isEdit) loadCourse()
  }, [id])

  const loadTeachers = async () => {
    try {
      const res = await api.get('/users', { params: { role: 'teacher', limit: 100 } })
      setTeachers(res.data.data.users || [])
    } catch (error) { console.error(error) }
  }

  const loadProblemSets = async () => {
    try {
      const res = await api.get('/problem-sets', { params: { limit: 200 } })
      setProblemSets(res.data.data.problemSets || [])
    } catch (error) { console.error(error) }
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
        problem_set_id: course.problem_set_id || undefined,
      })

      const lessonsData = lessonsRes.data.data.lessons || []
      const lessonsWithMaterials = await Promise.all(
        lessonsData.map(async (lesson: any) => {
          try {
            const matRes = await api.get(`/lessons/${lesson.id}`)
            return { ...lesson, materials: matRes.data.data.materials || [] }
          } catch {
            return { ...lesson, materials: [] }
          }
        })
      )
      setLessons(lessonsWithMaterials)
    } catch (error) { console.error(error) } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      if (isEdit) {
        await api.put(`/courses/${id}`, values)
        // Update problem set association
        const psId = values.problem_set_id || null
        await api.put(`/courses/${id}/problem-set`, { problem_set_id: psId }).catch(() => {})
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
      title: '', description: '', knowledge_point: '',
      order_index: lessons.length + 1, materials: [],
    }])
  }

  const updateLesson = (index: number, field: string, value: string) => {
    const updated = [...lessons]
    updated[index] = { ...updated[index], [field]: value }
    setLessons(updated)
  }

  const removeLesson = async (index: number) => {
    const lesson = lessons[index]
    if (lesson.id) {
      try { await api.delete(`/lessons/${lesson.id}`) } catch (error) { console.error(error) }
    }
    setLessons(lessons.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (lessonIndex: number, file: File) => {
    const lesson = lessons[lessonIndex]
    if (!lesson.id) {
      message.warning('请先保存课程和课时，再上传素材')
      return false
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('course_id', String(id))
    formData.append('lesson_id', String(lesson.id))
    formData.append('title', file.name)

    try {
      const res = await fetch(`${API_BASE}/api/materials/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      })
      const result = await res.json()
      if (result.success) {
        message.success(`${file.name} 上传成功`)
        const updated = [...lessons]
        updated[lessonIndex] = {
          ...updated[lessonIndex],
          materials: [...(updated[lessonIndex].materials || []), result.data.material],
        }
        setLessons(updated)
      } else {
        message.error(result.error?.message || '上传失败')
      }
    } catch {
      message.error('上传失败')
    }
    return false
  }

  const handleDeleteMaterial = async (lessonIndex: number, materialId: number) => {
    try {
      await api.delete(`/materials/${materialId}`)
      message.success('已删除')
      const updated = [...lessons]
      updated[lessonIndex] = {
        ...updated[lessonIndex],
        materials: (updated[lessonIndex].materials || []).filter((m: any) => m.id !== materialId),
      }
      setLessons(updated)
    } catch {
      message.error('删除失败')
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraOutlined />
      case 'ppt': return <FileTextOutlined />
      default: return <FilePdfOutlined />
    }
  }

  const getFileUrl = (url: string) => url?.startsWith('http') ? url : `${API_BASE}${url}`

  const formatSize = (bytes: number) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

      <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
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

          <Form.Item name="problem_set_id" label="关联题单">
            <Select style={{ width: 200 }} placeholder="选择题单" allowClear
              options={problemSets.map((ps: any) => ({ label: ps.title, value: ps.id }))} />
          </Form.Item>
        </Space>
      </Form>

      <Card
        title="课时列表"
        size="small"
        style={{ marginBottom: 24, maxWidth: 800 }}
        extra={<Button type="link" icon={<PlusOutlined />} onClick={addLesson}>添加课时</Button>}
      >
        {lessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无课时，点击上方按钮添加</div>
        ) : (
          lessons.map((lesson, index) => (
            <Card key={index} size="small" style={{ marginBottom: 12 }}
              title={`课时 ${index + 1}${lesson.title ? ` - ${lesson.title}` : ''}`}
              extra={
                <Popconfirm title="删除该课时及其所有素材？" onConfirm={() => removeLesson(index)}>
                  <Button type="link" danger icon={<DeleteOutlined />} size="small">删除课时</Button>
                </Popconfirm>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Input placeholder="课时标题" value={lesson.title}
                  onChange={e => updateLesson(index, 'title', e.target.value)} />
                <Input placeholder="知识点" value={lesson.knowledge_point}
                  onChange={e => updateLesson(index, 'knowledge_point', e.target.value)} />
                <TextArea rows={2} placeholder="课时描述" value={lesson.description}
                  onChange={e => updateLesson(index, 'description', e.target.value)} />

                {/* 素材管理区域 */}
                <Card size="small" type="inner" title={
                  <Space><UploadOutlined /> 课件素材</Space>
                }>
                  {lesson.id ? (
                    <>
                      <Upload
                        showUploadList={false}
                        beforeUpload={() => false}
                        onChange={({ file }) => {
                          if (file.originFileObj) handleFileUpload(index, file.originFileObj)
                        }}
                        accept=".mp4,.webm,.ppt,.pptx,.pdf,.doc,.docx"
                      >
                        <Button size="small" icon={<UploadOutlined />} style={{ marginBottom: 8 }}>
                          上传视频/PPT/PDF
                        </Button>
                      </Upload>

                      {(lesson.materials || []).length > 0 && (
                        <List
                          size="small"
                          dataSource={lesson.materials}
                          renderItem={(mat: any) => (
                            <List.Item
                              actions={[
                                <Button size="small" type="link" icon={<DownloadOutlined />}
                                  href={getFileUrl(mat.file_url)} target="_blank" />,
                                <Popconfirm title="删除该素材？" onConfirm={() => handleDeleteMaterial(index, mat.id)}>
                                  <Button size="small" type="link" danger icon={<DeleteOutlined />} />
                                </Popconfirm>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={getFileIcon(mat.type)}
                                title={mat.title || mat.file_name}
                                description={
                                  <Space size={8}>
                                    <Tag color={mat.type === 'video' ? 'blue' : mat.type === 'ppt' ? 'red' : 'green'}>
                                      {mat.type === 'video' ? '视频' : mat.type === 'ppt' ? 'PPT' : '文档'}
                                    </Tag>
                                    <span style={{ fontSize: 12, color: '#999' }}>{formatSize(mat.file_size)}</span>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </>
                  ) : (
                    <div style={{ color: '#999', fontSize: 13 }}>
                      请先保存课程后再上传素材
                    </div>
                  )}
                </Card>
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
