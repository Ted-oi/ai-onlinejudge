import { useState, useEffect } from 'react'
import { Card, Row, Col, Input, Select, Tag, Progress, Space, Typography, Spin, Empty } from 'antd'
import { SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import problemSetService from '../../services/problemSet.service'
import { PROBLEM_SET_CATEGORIES } from '../../types/problemSet'
import type { ProblemSet } from '../../types'

const { Title, Text, Paragraph } = Typography

const difficultyConfig: Record<string, { color: string; label: string }> = {
  easy: { color: 'green', label: '简单' },
  medium: { color: 'orange', label: '中等' },
  hard: { color: 'red', label: '困难' },
  mixed: { color: 'blue', label: '混合' },
}

const ProblemSetList = () => {
  const navigate = useNavigate()
  const [sets, setSets] = useState<ProblemSet[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<string | undefined>()
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const fetchSets = async () => {
    setLoading(true)
    try {
      const data = await problemSetService.getProblemSets({
        category, difficulty, search: search || undefined, page, limit: 12,
      })
      setSets(data.problemSets)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSets() }, [page, category, difficulty])

  const getCategoryLabel = (cat: string) =>
    PROBLEM_SET_CATEGORIES.find(c => c.value === cat)?.label || cat

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 4 }}>题单</Title>
        <Text type="secondary">按算法知识点分类的经典题目合集，系统化刷题</Text>
      </div>

      <Space style={{ marginBottom: 24 }} wrap>
        <Input
          placeholder="搜索题单"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 220 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onPressEnter={() => { setPage(1); fetchSets() }}
        />
        <Select
          placeholder="分类筛选"
          allowClear
          style={{ width: 140 }}
          value={category}
          onChange={v => { setCategory(v); setPage(1) }}
          options={PROBLEM_SET_CATEGORIES.map(c => ({ label: c.label, value: c.value }))}
        />
        <Select
          placeholder="难度筛选"
          allowClear
          style={{ width: 120 }}
          value={difficulty}
          onChange={v => { setDifficulty(v); setPage(1) }}
          options={[
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'medium' },
            { label: '困难', value: 'hard' },
            { label: '混合', value: 'mixed' },
          ]}
        />
      </Space>

      <Spin spinning={loading}>
        {sets.length === 0 && !loading ? (
          <Empty description="暂无题单" />
        ) : (
          <Row gutter={[16, 16]}>
            {sets.map(ps => {
              const diff = difficultyConfig[ps.difficulty] || difficultyConfig.mixed
              const problemCount = ps.problem_count ?? (ps.problem_ids?.length || 0)
              const solvedCount = ps.solved_count ?? 0
              const progressPercent = ps.progress ?? (problemCount > 0 ? Math.round((solvedCount / problemCount) * 100) : 0)

              return (
                <Col xs={24} sm={12} md={8} lg={8} key={ps.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 8, overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                    onClick={() => navigate(`/problem-sets/${ps.id}`)}
                  >
                    <div style={{
                      height: 80,
                      background: `linear-gradient(135deg, ${ps.cover_color || '#1890ff'}, ${ps.cover_color || '#1890ff'}88)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      <CheckCircleOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }} />
                      {progressPercent === 100 && (
                        <Tag color="gold" style={{ position: 'absolute', top: 8, right: 8 }}>已完成</Tag>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <Title level={5} style={{ marginBottom: 4, marginTop: 0 }}>{ps.title}</Title>
                      <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 8, minHeight: 44 }}>
                        {ps.description || '暂无描述'}
                      </Paragraph>
                      <Space size={8} style={{ marginBottom: 12 }}>
                        <Tag>{getCategoryLabel(ps.category)}</Tag>
                        <Tag color={diff.color}>{diff.label}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{problemCount} 题</Text>
                      </Space>
                      {problemCount > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12 }}>完成进度</Text>
                            <Text style={{ fontSize: 12, color: progressPercent >= 100 ? '#52c41a' : undefined }}>
                              {solvedCount}/{problemCount}
                            </Text>
                          </div>
                          <Progress
                            percent={progressPercent}
                            size="small"
                            showInfo={false}
                            strokeColor={progressPercent >= 100 ? '#52c41a' : '#1890ff'}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Spin>

      {total > 12 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <a onClick={() => setPage(p => Math.max(1, p - 1))} style={{ visibility: page <= 1 ? 'hidden' : undefined }}>上一页</a>
            <Text>第 {page} 页</Text>
            <a onClick={() => page * 12 < total && setPage(p => p + 1)} style={{ visibility: page * 12 >= total ? 'hidden' : undefined }}>下一页</a>
          </Space>
        </div>
      )}
    </div>
  )
}

export default ProblemSetList
