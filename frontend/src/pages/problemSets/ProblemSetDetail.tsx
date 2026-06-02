import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Typography, Progress, List, Space, Spin, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, MinusCircleOutlined, CodeOutlined } from '@ant-design/icons'
import problemSetService from '../../services/problemSet.service'
import { PROBLEM_SET_CATEGORIES } from '../../types/problemSet'
import type { ProblemSetDetail as ProblemSetData, ProblemSetProblem } from '../../types'

const { Title, Text } = Typography

const difficultyConfig: Record<string, { color: string; label: string }> = {
  easy: { color: 'green', label: '简单' },
  medium: { color: 'orange', label: '中等' },
  hard: { color: 'red', label: '困难' },
  mixed: { color: 'blue', label: '混合' },
}

const ProblemSetDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ProblemSetData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const result = await problemSetService.getProblemSetById(Number(id))
      setData(result)
    } catch {
      message.error('获取题单详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  if (!data) {
    return <Card><div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">题单不存在</Text></div></Card>
  }

  const { problemSet, problems, solvedProblemIds, progress } = data
  const diff = difficultyConfig[problemSet.difficulty] || difficultyConfig.mixed
  const catLabel = PROBLEM_SET_CATEGORIES.find(c => c.value === problemSet.category)?.label || problemSet.category

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/problem-sets')} style={{ marginBottom: 16 }}>
        返回题单列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Space style={{ marginBottom: 8 }}>
              <Tag>{catLabel}</Tag>
              <Tag color={diff.color}>{diff.label}</Tag>
            </Space>
            <Title level={3} style={{ marginBottom: 4 }}>{problemSet.title}</Title>
            <Text type="secondary">{problemSet.description}</Text>
          </div>
          <Card style={{ minWidth: 200, textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={progress.percentage}
              size={80}
              strokeColor={progress.percentage >= 100 ? '#52c41a' : '#1890ff'}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">已完成 {progress.solved_count}/{progress.total_count} 题</Text>
            </div>
          </Card>
        </div>
      </Card>

      <Card title={`题目列表 (${problems.length})`}>
        <List
          dataSource={problems}
          renderItem={(problem: ProblemSetProblem, index: number) => {
            const solved = solvedProblemIds.includes(problem.id)
            const pDiff = difficultyConfig[problem.difficulty] || difficultyConfig.mixed
            return (
              <List.Item
                actions={[
                  <Button
                    key="submit"
                    type={solved ? 'default' : 'primary'}
                    size="small"
                    icon={<CodeOutlined />}
                    onClick={() => navigate(`/problems/${problem.id}/submit`)}
                  >
                    {solved ? '重做' : '做题'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    solved
                      ? <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a', marginTop: 4 }} />
                      : <MinusCircleOutlined style={{ fontSize: 20, color: '#d9d9d9', marginTop: 4 }} />
                  }
                  title={
                    <Space>
                      <Text type="secondary" style={{ minWidth: 28 }}>{index + 1}.</Text>
                      <a onClick={() => navigate(`/problems/${problem.id}`)}>{problem.title}</a>
                    </Space>
                  }
                  description={
                    <Space size={8}>
                      <Tag color={pDiff.color} style={{ fontSize: 11 }}>{pDiff.label}</Tag>
                      {solved && <Text style={{ color: '#52c41a', fontSize: 12 }}>已通过</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
          locale={{ emptyText: '暂无题目' }}
        />
      </Card>
    </div>
  )
}

export default ProblemSetDetail
