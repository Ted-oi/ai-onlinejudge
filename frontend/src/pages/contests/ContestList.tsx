import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Tag, Button, Tabs, Space, message } from 'antd'
import { TrophyOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import contestService from '../../services/contest.service'
import type { Contest } from '../../types/contest'

const { Title, Text, Paragraph } = Typography

const ContestList = () => {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('ongoing')
  const navigate = useNavigate()

  const fetchContests = async (status?: string) => {
    try {
      setLoading(true)
      const data = await contestService.getContests(status ? { status: status as any } : undefined)
      setContests(data)
    } catch (error) {
      console.error('获取比赛列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContests(activeTab)
  }, [activeTab])

  const getContestStatus = (contest: Contest): { label: string; color: string } => {
    const now = dayjs()
    const start = dayjs(contest.start_time)
    const end = dayjs(contest.end_time)
    if (now.isBefore(start)) return { label: '即将开始', color: 'blue' }
    if (now.isAfter(end)) return { label: '已结束', color: 'default' }
    return { label: '进行中', color: 'green' }
  }

  const handleRegister = async (contestId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      await contestService.registerForContest(contestId, user.id)
      message.success('报名成功')
    } catch (error) {
      message.error('报名失败')
    }
  }

  const tabItems = [
    { key: 'ongoing', label: '进行中' },
    { key: 'upcoming', label: '即将开始' },
    { key: 'past', label: '已结束' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>比赛</Title>
        <Paragraph>参加在线编程竞赛，与其他选手一较高下。</Paragraph>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Row gutter={[16, 16]}>
        {contests.map((contest) => {
          const status = getContestStatus(contest)
          return (
            <Col xs={24} sm={12} lg={8} key={contest.id}>
              <Card
                hoverable
                loading={loading}
                onClick={() => navigate(`/contests/${contest.id}`)}
              >
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color={status.color}>{status.label}</Tag>
                    <Tag icon={<TrophyOutlined />} color="gold">
                      比赛
                    </Tag>
                  </Space>
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {contest.title}
                </Title>
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ color: '#666', marginBottom: 16 }}
                >
                  {contest.description}
                </Paragraph>
                <div style={{ marginBottom: 12 }}>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">
                      <ClockCircleOutlined /> 开始: {dayjs(contest.start_time).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Text type="secondary">
                      <ClockCircleOutlined /> 结束: {dayjs(contest.end_time).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {status.label !== '已结束' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<UserOutlined />}
                      onClick={(e) => handleRegister(contest.id, e)}
                    >
                      报名参加
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {!loading && contests.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
            <Title level={4} type="secondary">暂无比赛</Title>
          </div>
        </Card>
      )}
    </div>
  )
}

export default ContestList
