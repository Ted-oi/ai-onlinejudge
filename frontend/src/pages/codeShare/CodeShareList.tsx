import { useState, useEffect } from 'react'
import { Card, Row, Col, Input, Select, Button, Tag, Space, Spin, Empty, Avatar, Typography, message } from 'antd'
import { SearchOutlined, PlusOutlined, HeartOutlined, PushpinOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import codeShareService from '../../services/codeShare.service'
import type { SharedCode } from '../../types/codeShare'

const { Text } = Typography

const languages = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'Go', 'Rust', 'TypeScript']

const CodeShareList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [codes, setCodes] = useState<SharedCode[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<string | undefined>(undefined)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    const pid = searchParams.get('problem_id')
    fetchCodes(pid ? Number(pid) : undefined)
  }, [page, sort, searchParams])

  const fetchCodes = async (problem_id?: number) => {
    try {
      setLoading(true)
      const data = await codeShareService.getSharedCodes({
        page, limit: 20, sort, language, search: search || undefined, problem_id,
      })
      setCodes(data.codes)
      setTotal(data.total)
    } catch { message.error('获取代码列表失败') }
    finally { setLoading(false) }
  }

  const handleSearch = () => {
    setPage(1)
    fetchCodes()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索代码..." value={search}
            onChange={e => setSearch(e.target.value)}
            onSearch={handleSearch} style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select placeholder="语言" allowClear style={{ width: 120 }} value={language} onChange={v => { setLanguage(v); setPage(1) }}>
            {languages.map(l => <Select.Option key={l} value={l}>{l}</Select.Option>)}
          </Select>
          <Select style={{ width: 120 }} value={sort} onChange={v => { setSort(v); setPage(1) }}>
            <Select.Option value="newest">最新</Select.Option>
            <Select.Option value="most_liked">最多点赞</Select.Option>
            <Select.Option value="most_pinned">最多收藏</Select.Option>
          </Select>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/code-shares/create')}>
          分享代码
        </Button>
      </div>

      {loading ? <Spin style={{ display: 'block', margin: '60px auto' }} /> : codes.length === 0 ? (
        <Empty description="暂无代码分享" />
      ) : (
        <Row gutter={[16, 16]}>
          {codes.map(code => (
            <Col xs={24} md={12} lg={8} key={code.id}>
              <Card hoverable onClick={() => navigate(`/code-shares/${code.id}`)}
                style={{ height: '100%' }}
                styles={{ body: { padding: 16 } }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>{code.title}</Text>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Tag color="blue">{code.language}</Tag>
                  {code.problem_title && <Tag color="purple">#{code.problem_id} {code.problem_title}</Tag>}
                </div>
                <pre style={{
                  background: '#f5f5f5', borderRadius: 6, padding: '8px 12px',
                  maxHeight: 80, overflow: 'hidden', fontSize: 12,
                  whiteSpace: 'pre-wrap', margin: '0 0 8px 0',
                }}>
                  {code.code.slice(0, 200)}{code.code.length > 200 ? '...' : ''}
                </pre>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} src={code.author_avatar} />
                    <Text type="secondary">{code.author_name}</Text>
                  </Space>
                  <Space size={12}>
                    <Text type="secondary"><HeartOutlined /> {code.like_count}</Text>
                    <Text type="secondary"><PushpinOutlined /> {code.pin_count}</Text>
                    <Text type="secondary"><EyeOutlined /> {code.views}</Text>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {total > 20 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space>
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Text>{page} / {Math.ceil(total / 20)}</Text>
            <Button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </Space>
        </div>
      )}
    </div>
  )
}

export default CodeShareList
