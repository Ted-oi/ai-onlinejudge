import { useState, useEffect, useRef } from 'react'
import { Badge, Dropdown, List, Button, Empty, Typography, Space } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import notificationService from '../../services/notification.service'
import dayjs from 'dayjs'

const { Text } = Typography

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount()
      setUnreadCount(data.count)
    } catch (error) { console.error(error) }
  }

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications({ limit: 20 })
      setNotifications(data.notifications)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    fetchUnreadCount()
    pollRef.current = setInterval(fetchUnreadCount, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  const handleMarkRead = async (id: number) => {
    await notificationService.markAsRead(id)
    setUnreadCount(prev => Math.max(0, prev - 1))
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead()
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleClick = (notification: any) => {
    if (!notification.is_read) handleMarkRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
      setOpen(false)
    }
  }

  const dropdownContent = (
    <div style={{ width: 380, maxHeight: 500, overflow: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>通知</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>全部已读</Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty description="暂无通知" style={{ padding: 24 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: item.is_read ? '#fff' : '#f6ffed',
              }}
              onClick={() => handleClick(item)}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong={!item.is_read}>{item.title}</Text>
                    {!item.is_read && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <>
                    {item.content && <div style={{ marginBottom: 4 }}>{item.content}</div>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  )
}

export default NotificationCenter
