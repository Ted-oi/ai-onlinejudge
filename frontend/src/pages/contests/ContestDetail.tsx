import { useState, useEffect } from 'react'
import { Card, Typography, Tag, Button, Table, Space, Spin, message } from 'antd'
import { ArrowLeftOutlined, TrophyOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import contestService from '../../services/contest.service'
import { problemService } from '../../services/problem.service'
import type { ContestDetail } from '../../types/contest'
import type { Problem } from '../../types'

const { Title, Text, Paragraph } = Typography

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contest, setContest] = useState<ContestDetail | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchContest()
  }, [id])

  const fetchContest = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await contestService.getContestById(Number(id))
      setContest(data)
      if (data.problem_ids && data.problem_ids.length > 0) {
        const problemList = await Promise.all(
          data.problem_ids.map(pid => problemService.getProblemById(pid))
        )
        setProblems(problemList)
      }
    } catch (error) {
      message.error('获取比赛详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!id) return
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      await contestService.registerForContest(Number(id), user.id)
      message.success('报名成功')
    } catch (error) {
      message.error('报名失败')
    }
  }

  const getContestStatus = () => {
    if (!contest) return { label: '', color: '' }
    const now = dayjs()
    const start = dayjs(contest.start_time)
    const end = dayjs(contest.end_time)
    if (now.isBefore(start)) return { label: '即将开始', color: 'blue' }
    if (now.isAfter(end)) return { label: '已结束', color: 'default' }
    return { label: '进行中', color: 'green' }
  }

  const status = getContestStatus()

  const problemColumns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => String.fromCharCode(65 + index),
    },
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Problem) => (
        <Button type="link" onClick={() => navigate(`/problems/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: string) => {
        const colors: Record<string, string> = {
          easy: 'green',
          medium: 'orange',
          hard: 'red',
        }
        const labels: Record<string, string> = {
          easy: '简单',
          medium: '中等',
          hard: '困难',
        }
        return <Tag color={colors[difficulty]}>{labels[difficulty] || difficulty}</Tag>
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!contest) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Title level={4} type="secondary">比赛不存在</Title>
          <Button onClick={() => navigate('/contests')}>返回列表</Button>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/contests')}
        style={{ marginBottom: 16 }}
      >
        返回比赛列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Space style={{ marginBottom: 12 }}>
              <Tag color={status.color}>{status.label}</Tag>
              <Tag icon={<TrophyOutlined />} color="gold">比赛</Tag>
            </Space>
            <Title level={2} style={{ marginBottom: 8 }}>{contest.title}</Title>
            <Paragraph style={{ color: '#666', maxWidth: 600 }}>
              {contest.description}
            </Paragraph>
            <Space direction="vertical" size={4}>
              <Text type="secondary">
                <ClockCircleOutlined /> 开始时间: {dayjs(contest.start_time).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
              <Text type="secondary">
                <ClockCircleOutlined /> 结束时间: {dayjs(contest.end_time).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
              <Text type="secondary">
                <UserOutlined /> 创建者ID: {contest.creator_id}
              </Text>
            </Space>
          </div>
          {status.label !== '已结束' && (
            <Button type="primary" icon={<UserOutlined />} onClick={handleRegister}>
              报名参加
            </Button>
          )}
        </div>
      </Card>

      <Card title={<Title level={4} style={{ margin: 0 }}>比赛题目</Title>}>
        {problems.length > 0 ? (
          <Table
            columns={problemColumns}
            dataSource={problems}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">暂无题目</Text>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ContestDetail
