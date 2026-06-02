import { useState, useEffect } from 'react'
import { Table, Input, Select, Tag, message, Card, Statistic, Row, Col, Popconfirm, Button, Space, Avatar, List, Typography } from 'antd'
import { TeamOutlined, DeleteOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import teamService from '../../services/team.service'
import dayjs from 'dayjs'

const { Search } = Input
const { Text } = Typography

const typeMap: Record<string, { color: string; label: string }> = {
  team: { color: 'blue', label: '团队' },
  class: { color: 'green', label: '班级' },
}

interface TeamRecord {
  id: number
  name: string
  description: string
  team_type: string
  leader_id: number
  leader_name?: string
  member_count?: number
  is_public: boolean
  invite_code?: string
  max_members: number
  created_at: string
}

const AdminTeamList = () => {
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [teamDetail, setTeamDetail] = useState<{ members: any[]; stats: any } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadTeams()
  }, [search, typeFilter, pagination.current, pagination.pageSize])

  const loadTeams = async () => {
    setLoading(true)
    try {
      const data = await teamService.getTeams({
        search: search || undefined,
        team_type: typeFilter || undefined,
        page: pagination.current,
        limit: pagination.pageSize,
      })
      setTeams(data.teams || [])
      setPagination(prev => ({ ...prev, total: data.total || 0 }))
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await teamService.deleteTeam(id)
      message.success('团队已删除')
      loadTeams()
    } catch {
      // handled by interceptor
    }
  }

  const handleExpand = async (teamId: number) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
      setTeamDetail(null)
      return
    }
    setExpandedTeam(teamId)
    try {
      const [membersData, statsData] = await Promise.all([
        teamService.getTeamMembers(teamId),
        teamService.getTeamStats(teamId),
      ])
      setTeamDetail({ members: membersData.members || [], stats: statsData })
    } catch {
      setTeamDetail(null)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a: TeamRecord, b: TeamRecord) => a.id - b.id,
    },
    {
      title: '团队名称',
      dataIndex: 'name',
      width: 180,
      render: (name: string, record: TeamRecord) => (
        <a onClick={() => navigate(`/teams/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'team_type',
      width: 80,
      render: (type: string) => {
        const info = typeMap[type]
        return <Tag color={info?.color}>{info?.label || type}</Tag>
      },
    },
    {
      title: '队长ID',
      dataIndex: 'leader_id',
      width: 80,
    },
    {
      title: '成员数',
      dataIndex: 'member_count',
      width: 80,
      sorter: (a: TeamRecord, b: TeamRecord) => (a.member_count || 0) - (b.member_count || 0),
    },
    {
      title: '上限',
      dataIndex: 'max_members',
      width: 70,
    },
    {
      title: '公开',
      dataIndex: 'is_public',
      width: 60,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '邀请码',
      dataIndex: 'invite_code',
      width: 100,
      render: (v: string) => v ? <Text code>{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      sorter: (a: TeamRecord, b: TeamRecord) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, record: TeamRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); navigate(`/teams/${record.id}`) }}
          />
          <Popconfirm
            title="确定删除该团队？"
            description="删除后无法恢复，所有成员将被移除"
            onConfirm={(e) => { e?.stopPropagation(); handleDelete(record.id) }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>团队管理</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Search
          placeholder="搜索团队名称"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="类型筛选"
          allowClear
          style={{ width: 120 }}
          onChange={setTypeFilter}
          options={[
            { label: '团队', value: 'team' },
            { label: '班级', value: 'class' },
          ]}
        />
      </div>

      <Table
        dataSource={teams}
        columns={columns}
        rowKey="id"
        loading={loading}
        onRow={(record) => ({
          onClick: () => handleExpand(record.id),
          style: { cursor: 'pointer' },
        })}
        expandable={{
          expandedRowKeys: expandedTeam ? [expandedTeam] : [],
          expandedRowRender: () => {
            if (!teamDetail) return null
            const { members, stats } = teamDetail
            return (
              <Row gutter={24}>
                <Col span={10}>
                  <Card size="small" title={<Space><TeamOutlined />成员列表 ({members.length})</Space>}>
                    <List
                      size="small"
                      dataSource={members}
                      renderItem={(m: any) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar size="small" icon={<UserOutlined />} src={m.avatar} />}
                            title={
                              <Space>
                                <a onClick={() => navigate(`/users/${m.user_id}`)}>{m.username}</a>
                                <Tag color={m.role === 'leader' ? 'red' : m.role === 'co_leader' ? 'blue' : 'default'}>
                                  {m.role === 'leader' ? '队长' : m.role === 'co_leader' ? '副队长' : '成员'}
                                </Tag>
                              </Space>
                            }
                            description={`加入于 ${dayjs(m.joined_at).format('YYYY-MM-DD')}`}
                          />
                          <Space>
                            <Statistic title="解题" value={m.solved_count || 0} valueStyle={{ fontSize: 14 }} />
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col span={14}>
                  <Card size="small" title="团队统计">
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Statistic title="总解题数" value={stats?.total_solved || 0} prefix={<TeamOutlined />} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="总提交数" value={stats?.total_submissions || 0} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="通过率" value={stats?.total_submissions ? `${Math.round((stats.total_solved / stats.total_submissions) * 100)}%` : '-'} />
                      </Col>
                    </Row>
                    {stats?.category_breakdown && stats.category_breakdown.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>分类分布</Text>
                        <Row gutter={[8, 8]}>
                          {stats.category_breakdown.map((c: any) => (
                            <Col key={c.category}>
                              <Tag>{c.category}: {c.solved}题</Tag>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            )
          },
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个团队`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
        }}
      />
    </div>
  )
}

export default AdminTeamList
