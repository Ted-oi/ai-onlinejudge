import { useState, useEffect } from 'react'
import { Card, Button, Typography, Tag, Tabs, Table, Statistic, Row, Col, Spin, message, Space, Popconfirm, Avatar, Empty, Progress } from 'antd'
import { ArrowLeftOutlined, UserOutlined, LogoutOutlined, CopyOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import teamService from '../../services/team.service'
import type { Team, TeamMember, TeamStats } from '../../types/team'

const { Text, Paragraph } = Typography

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isLeader = team?.my_role === 'leader' || currentUser.role === 'admin'

  useEffect(() => {
    if (id) { fetchTeam(); fetchMembers() }
  }, [id])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const data = await teamService.getTeamById(Number(id))
      setTeam(data.team)
    } catch { message.error('加载失败') }
    finally { setLoading(false) }
  }

  const fetchMembers = async () => {
    try {
      const [m, s, l] = await Promise.all([
        teamService.getTeamMembers(Number(id)),
        teamService.getTeamStats(Number(id)),
        teamService.getTeamLeaderboard(Number(id)),
      ])
      setMembers(m.members)
      setStats(s)
      setLeaderboard(l.leaderboard)
    } catch {}
  }

  const handleLeave = async () => {
    try {
      await teamService.leaveTeam(Number(id))
      message.success('已退出团队')
      navigate('/teams')
    } catch (e: any) { message.error(e?.response?.data?.error?.message || '退出失败') }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await teamService.removeMember(Number(id), userId)
      message.success('已移除')
      fetchMembers()
    } catch { message.error('移除失败') }
  }

  const handleCopyCode = () => {
    if (team?.invite_code) {
      navigator.clipboard.writeText(team.invite_code)
      message.success('邀请码已复制')
    }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '60px auto' }} />
  if (!team) return <div>团队不存在</div>

  const memberColumns = [
    {
      title: '排名', key: 'rank', width: 60,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: '成员', key: 'user',
      render: (_: any, r: TeamMember) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={r.avatar} />
          <Button type="link" size="small" onClick={() => navigate(`/users/${r.id}`)}>{r.username}</Button>
        </Space>
      ),
    },
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (role: string) => <Tag color={role === 'leader' ? 'gold' : 'default'}>{role === 'leader' ? '队长' : role === 'co_leader' ? '副队长' : '成员'}</Tag>,
    },
    { title: 'Rating', dataIndex: 'rating', key: 'rating' },
    { title: '已解决', dataIndex: 'solved_count', key: 'solved_count' },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: TeamMember) => isLeader && r.role !== 'leader' && (
        <Space>
          <Popconfirm title="确定移除？" onConfirm={() => handleRemoveMember(r.id)}>
            <Button size="small" danger>移除</Button>
          </Popconfirm>
          <Popconfirm title={`转让队长给 ${r.username}？`} onConfirm={async () => {
            await teamService.transferLeadership(Number(id), r.id)
            fetchTeam(); fetchMembers()
          }}>
            <Button size="small">转让队长</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{team.name}</h2>
              <Tag color={team.team_type === 'class' ? 'purple' : 'blue'}>{team.team_type === 'class' ? '班级' : '团队'}</Tag>
            </div>
            {team.description && <Paragraph type="secondary">{team.description}</Paragraph>}
            <Space>
              <Text type="secondary"><UserOutlined /> {members.length} / {team.max_members} 人</Text>
              <Text type="secondary">队长: {team.leader_name}</Text>
            </Space>
            {team.my_role && team.invite_code && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">邀请码: </Text>
                <Text code>{team.invite_code}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopyCode} style={{ marginLeft: 4 }}>复制</Button>
              </div>
            )}
          </div>
          {team.my_role && team.my_role !== 'leader' && (
            <Popconfirm title="确定退出？" onConfirm={handleLeave}>
              <Button icon={<LogoutOutlined />} danger>退出团队</Button>
            </Popconfirm>
          )}
        </div>
      </Card>

      <Card>
        <Tabs items={[
          {
            key: 'members',
            label: `成员 (${members.length})`,
            children: <Table columns={memberColumns} dataSource={members} rowKey="id" size="small" pagination={false} />,
          },
          {
            key: 'stats',
            label: '统计',
            children: stats ? (
              <div>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}><Card><Statistic title="总解决" value={stats.total_solved} /></Card></Col>
                  <Col span={6}><Card><Statistic title="总提交" value={stats.total_submissions} /></Card></Col>
                  <Col span={6}><Card><Statistic title="活跃成员(7天)" value={stats.active_members} /></Card></Col>
                  <Col span={6}><Card><Statistic title="成员数" value={stats.member_count} /></Card></Col>
                </Row>
                {Object.keys(stats.category_breakdown).length > 0 && (
                  <Card title="分类统计">
                    {Object.entries(stats.category_breakdown).map(([cat, count]) => (
                      <div key={cat} style={{ marginBottom: 8 }}>
                        <Text>{cat}</Text>
                        <Progress percent={Math.min(100, (count as number / Math.max(...Object.values(stats.category_breakdown) as number[])) * 100)}
                          format={() => `${count}`} size="small" />
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            ) : <Empty />,
          },
          {
            key: 'leaderboard',
            label: '内部排行',
            children: (
              <Table
                columns={[
                  { title: '排名', key: 'rank', render: (_: any, __: any, i: number) => i + 1 },
                  { title: '用户', key: 'user', render: (_: any, r: any) => <Space><Avatar size="small" icon={<UserOutlined />} src={r.avatar} />{r.username}</Space> },
                  { title: '解决数', dataIndex: 'solved_count' },
                  { title: 'Rating', dataIndex: 'rating' },
                ]}
                dataSource={leaderboard} rowKey="id" size="small" pagination={false}
              />
            ),
          },
        ]} />
      </Card>
    </div>
  )
}

export default TeamDetail
