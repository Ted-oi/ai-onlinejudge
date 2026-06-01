import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, List, Tag, Button, Space, Spin, Progress } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, CodeOutlined } from '@ant-design/icons'
import assignmentService from '../../services/assignment.service'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assignmentService.getAssignment(Number(id)).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />
  if (!data) return <div>作业不存在</div>

  const { assignment, problems, mySubmissions } = data
  const now = dayjs()
  const end = dayjs(assignment.end_time)
  const isExpired = now.isAfter(end)
  const solvedProblemIds = mySubmissions
    ?.filter((s: any) => s.status === 'accepted')
    .map((s: any) => s.problem_id) || []
  const progress = problems.length > 0
    ? Math.round((new Set(solvedProblemIds).size / problems.length) * 100)
    : 0

  return (
    <div>
      <Title level={3}>{assignment.title}</Title>

      <Space style={{ marginBottom: 16 }}>
        <Tag icon={<ClockCircleOutlined />} color={isExpired ? 'red' : 'blue'}>
          截止：{dayjs(assignment.end_time).format('YYYY-MM-DD HH:mm')}
        </Tag>
        <Tag color={isExpired ? 'default' : 'green'}>
          {isExpired ? '已截止' : '进行中'}
        </Tag>
      </Space>

      {assignment.description && (
        <Paragraph style={{ marginBottom: 16 }}>{assignment.description}</Paragraph>
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Text>完成进度：</Text>
          <Progress percent={progress} style={{ width: 200 }} size="small" />
          <Text>{new Set(solvedProblemIds).size}/{problems.length} 题</Text>
        </Space>
      </Card>

      <List
        header={<Text strong>题目列表</Text>}
        bordered
        dataSource={problems}
        renderItem={(problem: any) => {
          const solved = solvedProblemIds.includes(problem.id)
          return (
            <List.Item
              actions={[
                !isExpired && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<CodeOutlined />}
                    onClick={() => navigate(`/problems/${problem.id}/submit`)}
                  >
                    做题
                  </Button>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  solved ? (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  ) : (
                    <CodeOutlined style={{ color: '#999', fontSize: 20 }} />
                  )
                }
                title={
                  <Space>
                    <a onClick={() => navigate(`/problems/${problem.id}`)}>{problem.title}</a>
                    <Tag color={problem.difficulty === 'easy' ? 'green' : problem.difficulty === 'medium' ? 'orange' : 'red'}>
                      {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                    </Tag>
                  </Space>
                }
                description={problem.category}
              />
            </List.Item>
          )
        }}
      />
    </div>
  )
}

export default AssignmentDetail
