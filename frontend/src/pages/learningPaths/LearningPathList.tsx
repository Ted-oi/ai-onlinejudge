import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, Tag, Progress, Spin, Empty, Select } from 'antd'
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import learningPathService from '../../services/learningPath.service'
import type { LearningPath } from '../../types/learningPath'

const { Text, Paragraph } = Typography

const categories = ['动态规划', '图论', '数据结构', '数学', '贪心', '字符串', '搜索', '基础算法']

const LearningPathList = () => {
  const navigate = useNavigate()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<string | undefined>()
  const [nextProblem, setNextProblem] = useState<any>(null)

  useEffect(() => {
    fetchPaths()
    learningPathService.getNextProblem().then(d => setNextProblem(d)).catch(() => {})
  }, [category])

  const fetchPaths = async () => {
    try {
      setLoading(true)
      const data = await learningPathService.getLearningPaths({ category, limit: 50 })
      setPaths(data.paths)
    } catch {} finally { setLoading(false) }
  }

  const handleEnroll = async (id: number) => {
    try {
      await learningPathService.enrollInPath(id)
      fetchPaths()
    } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>学习路径</h2>
        <Select placeholder="按分类筛选" allowClear style={{ width: 160 }} value={category} onChange={v => setCategory(v)}>
          {categories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
        </Select>
      </div>

      {/* Next Problem Card */}
      {nextProblem?.problem && (
        <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none' }}>
          <div style={{ color: '#fff' }}>
            <Text style={{ color: '#e0e7ff', fontSize: 13 }}>推荐下一题</Text>
            <div style={{ fontSize: 18, fontWeight: 600, margin: '4px 0' }}>
              #{nextProblem.problem.id} {nextProblem.problem.title}
            </div>
            <Text style={{ color: '#c7d2fe' }}>{nextProblem.reason}</Text>
            <Button style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
              onClick={() => navigate(`/problems/${nextProblem.problem.id}`)}>
              开始练习
            </Button>
          </div>
        </Card>
      )}

      {loading ? <Spin style={{ display: 'block', margin: '60px auto' }} /> : paths.length === 0 ? (
        <Empty description="暂无学习路径" />
      ) : (
        <Row gutter={[16, 16]}>
          {paths.map(p => (
            <Col xs={24} md={12} lg={8} key={p.id}>
              <Card hoverable onClick={() => navigate(`/learning-paths/${p.id}`)}
                style={{ borderTop: `3px solid ${p.cover_color}` }}>
                <div style={{ marginBottom: 8 }}>
                  <Tag color="purple">{p.category}</Tag>
                  <Text type="secondary">{p.problem_count || 0} 题</Text>
                </div>
                <h3 style={{ margin: '0 0 8px 0' }}>{p.title}</h3>
                <Paragraph ellipsis={{ rows: 2 }} type="secondary">{p.description || '暂无描述'}</Paragraph>

                {p.is_enrolled && p.progress && (
                  <div style={{ marginBottom: 8 }}>
                    <Progress percent={p.progress.percentage} size="small" strokeColor={p.cover_color} />
                    <Text type="secondary" style={{ fontSize: 12 }}>已解决 {p.progress.solved_problems}/{p.progress.total_problems}</Text>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {p.is_enrolled ? (
                    <Button size="small" icon={<CheckCircleOutlined />}>已加入</Button>
                  ) : (
                    <Button size="small" type="primary" icon={<PlayCircleOutlined />}
                      onClick={e => { e.stopPropagation(); handleEnroll(p.id) }}>加入</Button>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default LearningPathList
