import { useState, useEffect, useCallback } from 'react'
import { Card, Typography, Tag, Button, Table, Space, Tabs, Avatar, message } from 'antd'
import { ArrowLeftOutlined, TrophyOutlined, ClockCircleOutlined, UserOutlined, CodeOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import contestService from '../../services/contest.service'
import type { StandingEntry } from '../../services/contest.service'
import { problemService } from '../../services/problem.service'
import type { ContestDetail } from '../../types/contest'
import type { Problem } from '../../types'
import ContestRankingLive from '../../components/contests/ContestRankingLive'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'

const { Title, Text, Paragraph } = Typography

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const formatPenalty = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`
  return `${m} min`
}

const ContestDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contest, setContest] = useState<ContestDetail | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [standingsProblemIds, setStandingsProblemIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [standingsLoading, setStandingsLoading] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    fetchContest()
  }, [id])

  const updateCountdown = useCallback(() => {
    if (!contest) return
    const now = dayjs()
    const start = dayjs(contest.start_time)
    const end = dayjs(contest.end_time)

    if (now.isBefore(start)) {
      const diff = start.diff(now, 'second')
      setCountdown(`距离开始: ${formatDuration(diff)}`)
    } else if (now.isBefore(end)) {
      const diff = end.diff(now, 'second')
      setCountdown(`剩余时间: ${formatDuration(diff)}`)
    } else {
      setCountdown('比赛已结束')
    }
  }, [contest])

  useEffect(() => {
    if (!contest) return
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [contest, updateCountdown])

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

  const fetchStandings = async () => {
    if (!id) return
    try {
      setStandingsLoading(true)
      const data = await contestService.getStandings(Number(id))
      setStandings(data.standings)
      setStandingsProblemIds(data.problems)
    } catch {
      message.error('获取排名失败')
    } finally {
      setStandingsLoading(false)
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
        const colors: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
        const labels: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
        return <Tag color={colors[difficulty]}>{labels[difficulty] || difficulty}</Tag>
      },
    },
    ...(status.label === '进行中' || status.label === '即将开始' ? [{
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Problem) => (
        <Button
          type="primary"
          size="small"
          icon={<CodeOutlined />}
          onClick={() => navigate(`/problems/${record.id}/submit?contest_id=${id}`)}
        >
          做题
        </Button>
      ),
    }] : []),
  ]

  const standingsColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => {
        if (index === 0) return <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 18 }}>1</span>
        if (index === 1) return <span style={{ color: '#c0c0c0', fontWeight: 'bold', fontSize: 16 }}>2</span>
        if (index === 2) return <span style={{ color: '#cd7f32', fontWeight: 'bold', fontSize: 16 }}>3</span>
        return index + 1
      },
    },
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: StandingEntry) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate(`/users/${record.user_id}`)}>
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
          <span style={{ fontWeight: 500 }}>{record.username}</span>
        </div>
      ),
    },
    {
      title: '解题数',
      dataIndex: 'solved',
      key: 'solved',
      width: 80,
      render: (solved: number) => (
        <span style={{ color: solved > 0 ? '#52c41a' : undefined, fontWeight: 'bold' }}>
          {solved}/{standingsProblemIds.length}
        </span>
      ),
    },
    {
      title: '罚时',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (time: number) => <span>{formatPenalty(time)}</span>,
    },
    ...standingsProblemIds.map((pid, idx) => ({
      title: String.fromCharCode(65 + idx),
      key: `problem_${pid}`,
      width: 90,
      align: 'center' as const,
      render: (_: any, record: StandingEntry) => {
        const stat = record.problems[pid]
        if (!stat) return '-'
        if (stat.solved) {
          return (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#52c41a', fontWeight: 'bold' }}>+{stat.attempts > 1 ? stat.attempts : ''}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{formatPenalty(stat.time || 0)}</div>
            </div>
          )
        }
        if (stat.attempts > 0) {
          return <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>-{stat.attempts}</div>
        }
        return '-'
      },
    })),
  ]

  if (loading) {
    return <Card style={{ margin: 24 }}><LoadingSkeleton type="detail" /></Card>
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

  const tabItems = [
    {
      key: 'problems',
      label: '比赛题目',
      children: problems.length > 0 ? (
        <Table columns={problemColumns} dataSource={problems} rowKey="id" pagination={false} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">暂无题目</Text>
        </div>
      ),
    },
    {
      key: 'standings',
      label: '实时排名',
      children: (
        <div>
          <Table
            columns={standingsColumns}
            dataSource={standings}
            rowKey="user_id"
            loading={standingsLoading}
            pagination={false}
            locale={{ emptyText: '暂无排名数据' }}
          />
          {status.label === '进行中' && (
            <ContestRankingLive contestId={Number(id)} isOngoing={true} />
          )}
        </div>
      ),
    },
  ]

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
              {countdown && (
                <Text strong style={{ color: status.color === 'green' ? '#52c41a' : undefined }}>
                  <ClockCircleOutlined /> {countdown}
                </Text>
              )}
            </Space>
          </div>
          {status.label !== '已结束' && (
            <Button type="primary" icon={<UserOutlined />} onClick={handleRegister}>
              报名参加
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <Tabs
          items={tabItems}
          onChange={(key) => {
            if (key === 'standings' && standings.length === 0) {
              fetchStandings()
            }
          }}
        />
      </Card>
    </div>
  )
}

export default ContestDetail
