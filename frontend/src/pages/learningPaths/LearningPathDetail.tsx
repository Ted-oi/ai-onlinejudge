import { useState, useEffect } from 'react'
import { Card, Button, Typography, Tag, Spin, message, Space, Popconfirm, Progress } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, PlayCircleOutlined, MinusCircleOutlined, LogoutOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import learningPathService from '../../services/learningPath.service'
import type { LearningPathStage } from '../../types/learningPath'

const { Text, Paragraph } = Typography

const difficultyConfig: Record<string, { color: string; label: string }> = {
  easy: { color: '#10b981', label: '简单' },
  medium: { color: '#f59e0b', label: '中等' },
  hard: { color: '#ef4444', label: '困难' },
}

const LearningPathDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [path, setPath] = useState<any>(null)
  const [stages, setStages] = useState<LearningPathStage[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) fetchPath()
  }, [id])

  const fetchPath = async () => {
    try {
      setLoading(true)
      const data = await learningPathService.getLearningPathById(Number(id))
      setPath(data.path)
      setStages(data.stages)
      setIsEnrolled(data.is_enrolled)
    } catch { message.error('加载失败') }
    finally { setLoading(false) }
  }

  const handleEnroll = async () => {
    try {
      await learningPathService.enrollInPath(Number(id))
      setIsEnrolled(true)
      message.success('已加入学习路径')
    } catch { message.error('加入失败') }
  }

  const handleUnenroll = async () => {
    try {
      await learningPathService.unenrollFromPath(Number(id))
      setIsEnrolled(false)
      message.success('已退出')
    } catch { message.error('退出失败') }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '60px auto' }} />
  if (!path) return <div>路径不存在</div>

  const totalProblems = stages.reduce((sum, s) => sum + s.problems.length, 0)
  const solvedCount = stages.reduce((sum, s) => sum + s.problems.filter(p => p.is_solved).length, 0)

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>返回</Button>

      <Card style={{ marginBottom: 16, borderTop: `3px solid ${path.cover_color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0' }}>{path.title}</h2>
            <Space>
              <Tag color="purple">{path.category}</Tag>
              <Text type="secondary">{totalProblems} 题 / {stages.length} 阶段</Text>
              {path.estimated_hours && <Text type="secondary">预计 {path.estimated_hours} 小时</Text>}
            </Space>
            {path.description && <Paragraph style={{ marginTop: 8 }}>{path.description}</Paragraph>}
          </div>
          <Space>
            {isEnrolled ? (
              <Popconfirm title="确定退出此学习路径？" onConfirm={handleUnenroll}>
                <Button icon={<LogoutOutlined />} danger>退出</Button>
              </Popconfirm>
            ) : (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleEnroll}>加入学习</Button>
            )}
          </Space>
        </div>
        {isEnrolled && (
          <div style={{ marginTop: 16 }}>
            <Progress percent={totalProblems > 0 ? Math.round(solvedCount / totalProblems * 100) : 0}
              strokeColor={path.cover_color} />
            <Text type="secondary">进度：{solvedCount}/{totalProblems} 已解决</Text>
          </div>
        )}
      </Card>

      {/* Stages */}
      {stages.map((stage, stageIdx) => {
        const stageSolved = stage.problems.filter(p => p.is_solved).length
        return (
          <Card key={stage.id} title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: stageSolved === stage.problems.length ? '#10b981' : stageSolved > 0 ? '#4f46e5' : '#d9d9d9',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}>
                {stageSolved === stage.problems.length ? <CheckCircleOutlined /> : stageIdx + 1}
              </span>
              <span>{stage.title}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>({stageSolved}/{stage.problems.length})</Text>
            </div>
          } style={{ marginBottom: 12 }}>
            {stage.description && <Paragraph type="secondary">{stage.description}</Paragraph>}
            <div>
              {stage.problems.map((prob) => {
                const dc = difficultyConfig[prob.difficulty]
                return (
                  <div key={prob.problem_id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', marginBottom: 4, borderRadius: 6,
                    background: prob.is_solved ? '#f0fdf4' : '#fafafa', cursor: 'pointer',
                  }} onClick={() => navigate(`/problems/${prob.problem_id}`)}>
                    {prob.is_solved ? (
                      <CheckCircleOutlined style={{ color: '#10b981' }} />
                    ) : (
                      <MinusCircleOutlined style={{ color: '#d9d9d9' }} />
                    )}
                    <Text>{prob.problem_id}. {prob.title}</Text>
                    {dc && <Tag color={dc.color} style={{ marginLeft: 'auto' }}>{dc.label}</Tag>}
                    {!prob.is_required && <Tag>选修</Tag>}
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default LearningPathDetail
