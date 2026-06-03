import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Tag, Tabs, Input, Select, Spin, Empty, Space, message } from 'antd'
import { PlusOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import teamService from '../../services/team.service'
import type { Team } from '../../types/team'

const { Text, Paragraph } = Typography

const TeamList = () => {
  const navigate = useNavigate()
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [teamType, setTeamType] = useState<string | undefined>()
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [my, all] = await Promise.all([
        teamService.getMyTeams().catch(() => ({ teams: [] })),
        teamService.getTeams({ limit: 50 }).catch(() => ({ teams: [] })),
      ])
      setMyTeams((my as any).teams || [])
      setAllTeams((all as any).teams || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    try {
      const res = await teamService.joinByCode(joinCode.trim())
      message.success('加入成功')
      setJoinCode('')
      navigate(`/teams/${res.team_id}`)
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || '加入失败')
    }
  }

  const renderTeamCard = (team: Team) => (
    <Col xs={24} md={12} lg={8} key={team.id}>
      <Card hoverable onClick={() => navigate(`/teams/${team.id}`)}
        style={{ borderTop: team.team_type === 'class' ? '3px solid #7c3aed' : '3px solid #4f46e5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Tag color={team.team_type === 'class' ? 'purple' : 'blue'}>
            {team.team_type === 'class' ? '班级' : '团队'}
          </Tag>
          <Text type="secondary"><UserOutlined /> {team.member_count} 人</Text>
        </div>
        <h3 style={{ margin: '0 0 4px 0' }}>{team.name}</h3>
        <Text type="secondary">队长: {team.leader_name}</Text>
        {team.description && <Paragraph ellipsis={{ rows: 1 }} type="secondary" style={{ margin: '4px 0 0' }}>{team.description}</Paragraph>}
        {team.my_role && (
          <Tag color={team.my_role === 'leader' ? 'gold' : 'default'} style={{ marginTop: 8 }}>
            {team.my_role === 'leader' ? '队长' : team.my_role === 'co_leader' ? '副队长' : '成员'}
          </Tag>
        )}
      </Card>
    </Col>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>团队/班级</h2>
        <Space>
          <Input.Search placeholder="输入邀请码加入" value={joinCode} onChange={e => setJoinCode(e.target.value)}
            onSearch={handleJoinByCode} style={{ width: 200 }} enterButton="加入" />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/teams/create')}>创建</Button>
        </Space>
      </div>

      {loading ? <Spin style={{ display: 'block', margin: '60px auto' }} /> : (
        <Tabs items={[
          {
            key: 'my',
            label: `我的 (${myTeams.length})`,
            children: myTeams.length > 0 ? (
              <Row gutter={[16, 16]}>{myTeams.map(renderTeamCard)}</Row>
            ) : <Empty description="还没有加入团队" />,
          },
          {
            key: 'all',
            label: '发现',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input placeholder="搜索团队..." prefix={<SearchOutlined />} value={search}
                    onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
                  <Select placeholder="类型" allowClear style={{ width: 120 }} value={teamType} onChange={setTeamType}>
                    <Select.Option value="team">团队</Select.Option>
                    <Select.Option value="class">班级</Select.Option>
                  </Select>
                </Space>
                <Row gutter={[16, 16]}>
                  {allTeams.filter(t =>
                    (!search || t.name.includes(search)) && (!teamType || t.team_type === teamType)
                  ).map(renderTeamCard)}
                </Row>
              </>
            ),
          },
        ]} />
      )}
    </div>
  )
}

export default TeamList
