import { useState, useEffect, useRef } from 'react'
import { Table, Tag, Typography, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import contestService from '../../services/contest.service'

const { Text } = Typography

interface ContestRankingLiveProps {
  contestId: number
  isOngoing: boolean
}

const ContestRankingLive = ({ contestId, isOngoing }: ContestRankingLiveProps) => {
  const [standings, setStandings] = useState<any[]>([])
  const [prevStandings, setPrevStandings] = useState<Record<string, number>>({})
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const fetchStandings = async () => {
    try {
      const data = await contestService.getStandings(contestId)
      const newStandings = data.standings || []
      const prevMap: Record<string, number> = {}
      standings.forEach((s: any) => {
        prevMap[s.username] = s.rank
      })
      setPrevStandings(prevMap)
      setStandings(newStandings)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {}
  }

  useEffect(() => {
    fetchStandings()
    if (isOngoing) {
      pollRef.current = setInterval(fetchStandings, 30000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [contestId, isOngoing])

  const getRankChange = (username: string, currentRank: number) => {
    const prev = prevStandings[username]
    if (!prev || prev === currentRank) return <MinusOutlined style={{ color: '#999' }} />
    if (prev > currentRank) return <ArrowUpOutlined style={{ color: '#52c41a' }} />
    return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
  }

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 80,
      render: (rank: number, record: any) => (
        <Space>
          <Text strong>{rank}</Text>
          {getRankChange(record.username, rank)}
        </Space>
      ),
    },
    { title: '用户', dataIndex: 'username', width: 120 },
    {
      title: '通过数',
      dataIndex: 'solved_count',
      width: 80,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: '总用时',
      dataIndex: 'total_time',
      width: 100,
      render: (v: number) => v ? `${Math.floor(v / 60)}分${v % 60}秒` : '-',
    },
  ]

  return (
    <div>
      <Table
        columns={columns}
        dataSource={standings}
        rowKey="username"
        pagination={false}
        size="small"
      />
      {isOngoing && lastUpdated && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          最后更新：{lastUpdated}（每30秒自动刷新）
        </Text>
      )}
    </div>
  )
}

export default ContestRankingLive
