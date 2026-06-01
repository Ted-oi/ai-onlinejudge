import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { List, Button, Typography, Space, Modal, Form, Input, Avatar, Empty, Spin } from 'antd'
import { MessageOutlined, PushpinOutlined, PlusOutlined } from '@ant-design/icons'
import discussionService from '../../services/discussion.service'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

const DiscussionList = () => {
  const { problemId } = useParams<{ problemId: string }>()
  const navigate = useNavigate()
  const [discussions, setDiscussions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchDiscussions = async () => {
    try {
      const data = await discussionService.getDiscussions(Number(problemId))
      setDiscussions(data.discussions || [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDiscussions() }, [problemId])

  const handleCreate = async (values: any) => {
    await discussionService.createDiscussion(Number(problemId), values)
    form.resetFields()
    setModalOpen(false)
    fetchDiscussions()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>题目讨论</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          发起讨论
        </Button>
      </div>

      {loading ? <Spin /> : discussions.length === 0 ? (
        <Empty description="暂无讨论，来发起第一个吧" />
      ) : (
        <List
          dataSource={discussions}
          renderItem={(item: any) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '12px 16px' }}
              onClick={() => navigate(`/discussions/thread/${item.id}`)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<MessageOutlined />} src={item.avatar} />}
                title={
                  <Space>
                    {item.is_pinned && <PushpinOutlined style={{ color: '#faad14' }} />}
                    <Text strong>{item.title}</Text>
                  </Space>
                }
                description={
                  <Space split="|" size={8}>
                    <Text type="secondary">{item.username}</Text>
                    <Text type="secondary">{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</Text>
                    <Text type="secondary"><MessageOutlined /> {item.reply_count || 0}</Text>
                    <Text type="secondary">浏览 {item.views || 0}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title="发起讨论"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入讨论标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={6} placeholder="请输入讨论内容（支持 Markdown 格式）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">发布</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DiscussionList
