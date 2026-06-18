import { useState, useEffect, useRef } from 'react'
import {
  Card, Tabs, List, Avatar, Button, Input, Tag, Empty, Modal, Badge, message, Typography, Skeleton
} from 'antd'
import {
  UserAddOutlined, TeamOutlined, MessageOutlined, SearchOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, SendOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import friendService, { Friend, FriendRequest, Conversation, Message } from '../../services/friend.service'
import { getSocket } from '../../services/socket'
import { useTheme } from '../../components/common/ThemeSwitcher'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text, Title } = Typography

const Friends = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e'
  const bubbleMine = isDark ? '#1a6ed8' : '#1890ff'
  const bubbleOther = isDark ? '#2a2a2a' : '#f0f0f0'
  const bubbleOtherText = isDark ? '#fff' : '#333'

  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  // 搜索
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [reqMessage, setReqMessage] = useState('')

  // 聊天
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [f, inc, out, convs] = await Promise.all([
        friendService.list(),
        friendService.listRequests('incoming'),
        friendService.listRequests('outgoing'),
        friendService.listConversations(),
      ])
      setFriends(f.friends)
      setIncoming(inc.requests)
      setOutgoing(out.requests)
      setConversations(convs.conversations || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  // WebSocket 实时消息
  useEffect(() => {
    const socket = getSocket()
    const onNewMessage = (data: { conversation_id: number; message: Message }) => {
      setConversations(prev => prev.map(c =>
        c.conversation_id === data.conversation_id
          ? {
              ...c,
              last_message: data.message.content,
              last_message_at: data.message.created_at,
              unread_count: c.conversation_id === activeConv?.conversation_id ? 0 : c.unread_count + 1,
            }
          : c
      ))
      if (activeConv?.conversation_id === data.conversation_id) {
        setMessages(prev => [...prev, data.message])
      }
    }
    const onFriendRequest = () => {
      friendService.listRequests('incoming').then(r => setIncoming(r.requests))
    }
    socket.on('message:new', onNewMessage)
    socket.on('friend:request', onFriendRequest)
    return () => {
      socket.off('message:new', onNewMessage)
      socket.off('friend:request', onFriendRequest)
    }
  }, [activeConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSearch = async (q: string) => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const r = await friendService.search(q)
      setSearchResults(r.users)
    } catch {} finally { setSearchLoading(false) }
  }

  const handleSendRequest = async (toId: number) => {
    try {
      const res = await friendService.sendRequest(toId, reqMessage)
      message.success(res.message || '已发送')
      setSearchOpen(false)
      setSearchQ(''); setSearchResults([]); setReqMessage('')
      loadAll()
    } catch {}
  }

  const handleRespond = async (id: number, action: 'accept' | 'decline') => {
    try {
      const res = await friendService.respondRequest(id, action)
      message.success(res.message)
      loadAll()
    } catch {}
  }

  const handleRemove = (id: number, name: string) => {
    Modal.confirm({
      title: `删除好友 ${name}？`,
      content: '将同时清除你们的对话历史',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await friendService.remove(id)
        message.success('已删除')
        loadAll()
      },
    })
  }

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setTab('messages')
    setMsgLoading(true)
    try {
      const r = await friendService.getMessages(conv.conversation_id)
      setMessages(r.messages)
      // 标记已读
      setConversations(prev => prev.map(c =>
        c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
      ))
    } catch {} finally { setMsgLoading(false) }
  }

  const handleSend = async () => {
    if (!draft.trim() || !activeConv) return
    setSending(true)
    const content = draft
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const msg = await friendService.sendMessage({
        conversation_id: activeConv.conversation_id,
        content,
      })
      setMessages(prev => [...prev, {
        id: msg.id,
        sender_id: user.id,
        content,
        created_at: msg.created_at,
        username: user.username,
      }])
      setDraft('')
      setConversations(prev => prev.map(c =>
        c.conversation_id === activeConv.conversation_id
          ? { ...c, last_message: content, last_message_at: msg.created_at }
          : c
      ))
    } catch {} finally { setSending(false) }
  }

  const renderFriends = () => (
    <Card
      title={<><TeamOutlined /> 我的好友 ({friends.length})</>}
      extra={<Button icon={<UserAddOutlined />} type="primary" onClick={() => setSearchOpen(true)}>添加好友</Button>}
      style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}
    >
      {loading ? <Skeleton active /> : friends.length === 0 ? (
        <Empty description="还没有好友，去添加吧" />
      ) : (
        <List
          dataSource={friends}
          renderItem={(f) => (
            <List.Item
              actions={[
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => {
                    const conv = conversations.find(c =>
                      c.participants?.some(p => p.user_id === f.friend_id)
                    )
                    if (conv) openConversation(conv)
                    else message.info('对话尚未创建')
                  }}
                >私信</Button>,
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(f.friend_id, f.username)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={f.avatar} style={{ background: '#4f46e5' }}>{f.username?.[0]}</Avatar>}
                title={<a onClick={() => navigate(`/users/${f.friend_id}`)}>{f.username}</a>}
                description={<><Tag color="gold">Rating {f.rating}</Tag> 好友 {dayjs(f.since).fromNow()}</>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )

  const renderRequests = () => (
    <Card title="好友请求" style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12 }}>
      <Tabs
        items={[
          {
            key: 'incoming',
            label: <Badge count={incoming.length} offset={[8, -2]}>收到的</Badge>,
            children: incoming.length === 0 ? <Empty description="暂无请求" /> : (
              <List
                dataSource={incoming}
                renderItem={(r) => (
                  <List.Item
                    actions={[
                      <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleRespond(r.id, 'accept')}>接受</Button>,
                      <Button size="small" icon={<CloseOutlined />} onClick={() => handleRespond(r.id, 'decline')}>拒绝</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={r.avatar}>{r.username?.[0]}</Avatar>}
                      title={r.username}
                      description={<>{r.message && <Text type="secondary">{r.message} · </Text>}<Text type="secondary">{dayjs(r.created_at).fromNow()}</Text></>}
                    />
                  </List.Item>
                )}
              />
            ),
          },
          {
            key: 'outgoing',
            label: '已发出',
            children: outgoing.length === 0 ? <Empty description="没有发出的请求" /> : (
              <List
                dataSource={outgoing}
                renderItem={(r) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={r.avatar}>{r.username?.[0]}</Avatar>}
                      title={r.username}
                      description={<Text type="secondary">{dayjs(r.created_at).fromNow()}</Text>}
                    />
                    {r.status === 'declined' && <Tag color="red">已拒绝</Tag>}
                    {r.status === 'pending' && <Tag color="processing">等待对方确认</Tag>}
                  </List.Item>
                )}
              />
            ),
          },
        ]}
      />
    </Card>
  )

  const renderMessages = () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {/* 左侧会话列表 */}
      <Card
        style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, flex: '1 1 280px', maxWidth: 320, minHeight: 500 }}
        title="会话"
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24 }}><Empty description="暂无对话" /></div>
          ) : conversations.map(c => {
            const p = c.participants?.[0]
            return (
              <div
                key={c.conversation_id}
                onClick={() => openConversation(c)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: activeConv?.conversation_id === c.conversation_id
                    ? (isDark ? '#2a2a2a' : '#f0f5ff')
                    : 'transparent',
                  borderBottom: `1px solid ${cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge count={c.unread_count} size="small">
                    <Avatar src={p?.avatar} style={{ background: '#4f46e5' }}>{p?.username?.[0]}</Avatar>
                  </Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ color: textColor }}>{p?.username}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {c.last_message_at ? dayjs(c.last_message_at).format('MM-DD HH:mm') : ''}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.last_message || '暂无消息'}
                    </Text>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 右侧聊天窗 */}
      <Card
        style={{ background: cardBg, borderColor: cardBorder, borderRadius: 12, flex: '1 1 400px', minWidth: 320 }}
        styles={{ body: { display: 'flex', flexDirection: 'column', height: 500, padding: 0 } }}
      >
        {!activeConv ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="选择会话开始聊天" />
          </div>
        ) : (
          <>
            <div style={{ padding: 12, borderBottom: `1px solid ${cardBorder}` }}>
              <Text strong style={{ color: textColor }}>
                {activeConv.participants?.[0]?.username}
              </Text>
            </div>
            <div style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgLoading ? <Skeleton active /> : messages.map(m => {
                const mine = m.sender_id === Number(JSON.parse(localStorage.getItem('user') || '{}').id)
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: mine ? bubbleMine : bubbleOther,
                      color: mine ? '#fff' : bubbleOtherText,
                    }}>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                        {dayjs(m.created_at).format('MM-DD HH:mm')}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: 12, borderTop: `1px solid ${cardBorder}`, display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder="输入消息，回车发送"
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ flex: 1 }}
              />
              <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={handleSend} />
            </div>
          </>
        )}
      </Card>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2} style={{ color: textColor }}>
        <TeamOutlined style={{ marginRight: 8 }} />
        好友与私信
      </Title>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'friends', label: '好友列表', children: renderFriends() },
          { key: 'requests', label: <Badge count={incoming.length} offset={[8, -2]}>好友请求</Badge>, children: renderRequests() },
          { key: 'messages', label: <Badge count={conversations.reduce((s, c) => s + c.unread_count, 0)} offset={[8, -2]}>私信</Badge>, children: renderMessages() },
        ]}
      />

      <Modal
        title="添加好友"
        open={searchOpen}
        onCancel={() => setSearchOpen(false)}
        footer={null}
        width={500}
      >
        <Input.Search
          placeholder="输入用户名或邮箱搜索"
          prefix={<SearchOutlined />}
          value={searchQ}
          onChange={(e) => handleSearch(e.target.value)}
          loading={searchLoading}
          allowClear
        />
        {reqMessage !== '' || searchResults.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <Input.TextArea
              placeholder="附言（可选，最多 200 字）"
              value={reqMessage}
              onChange={(e) => setReqMessage(e.target.value.slice(0, 200))}
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ marginBottom: 12 }}
            />
          </div>
        ) : null}
        <List
          size="small"
          loading={searchLoading}
          dataSource={searchResults}
          locale={{ emptyText: searchQ ? '未找到用户' : '输入关键词开始搜索' }}
          renderItem={(u) => (
            <List.Item
              actions={[
                <Button type="primary" size="small" icon={<UserAddOutlined />} onClick={() => handleSendRequest(u.id)}>
                  添加
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={u.avatar}>{u.username?.[0]}</Avatar>}
                title={u.username}
                description={<><Tag color="gold">Rating {u.rating}</Tag> 已解决 {u.solved_count}</>}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}

export default Friends
