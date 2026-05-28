import { useState, useEffect } from 'react'
import { Table, Button, Tag, Popconfirm, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface CourseItem {
  id: number
  title: string
  description: string
  category: string
  instructor_id: number
  created_at: string
}

const AdminCourseList = () => {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const res = await api.get('/courses')
      setCourses(res.data.data.courses)
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/courses/${id}`)
      message.success('删除成功')
      loadCourses()
    } catch {
      // handled
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: CourseItem) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/admin/courses/${record.id}/edit`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此课程？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>课程管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/courses/create')}>
          创建课程
        </Button>
      </div>

      <Table
        dataSource={courses}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}

export default AdminCourseList
