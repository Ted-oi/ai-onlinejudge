import { useState, useEffect } from 'react'
import { Card, List, Tag, Typography, Space, Spin } from 'antd'
import { CompassOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { aiService } from '../../services/ai.service'

const { Text } = Typography

const ProblemRecommendation = () => {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    aiService.getRecommendations().then(data => {
      setRecommendations(data.recommendations || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (recommendations.length === 0 && !loading) return null

  return (
    <Card
      title={<Space><CompassOutlined /> 推荐题目</Space>}
      size="small"
    >
      {loading ? <Spin /> : (
        <List
          size="small"
          dataSource={recommendations}
          renderItem={(item: any) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 0' }}
              onClick={() => navigate(`/problems/${item.id}`)}
            >
              <List.Item.Meta
                title={<Text>{item.title}</Text>}
                description={
                  <Space size={4}>
                    <Tag color={item.difficulty === 'easy' ? 'green' : item.difficulty === 'medium' ? 'orange' : 'red'}>
                      {item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难'}
                    </Tag>
                    <Tag>{item.category}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export default ProblemRecommendation
