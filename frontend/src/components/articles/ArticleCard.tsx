import { Card, Typography, Space, Tag, Avatar } from 'antd'
import { EyeOutlined, HeartOutlined, MessageOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Article } from '../../types/article'

const { Text, Paragraph } = Typography

const typeConfig: Record<string, { color: string; label: string }> = {
  blog: { color: 'blue', label: '博客' },
  solution: { color: 'green', label: '题解' },
}

const ArticleCard = ({ article }: { article: Article }) => {
  const navigate = useNavigate()
  const tc = typeConfig[article.type]

  return (
    <Card
      hoverable
      style={{ marginBottom: 12 }}
      onClick={() => navigate(`/articles/${article.id}`)}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space wrap style={{ marginBottom: 6 }}>
            <Tag color={tc.color}>{tc.label}</Tag>
            {article.tags?.slice(0, 3).map((tag, i) => (
              <Tag key={i}>{tag}</Tag>
            ))}
            {article.problem_title && (
              <Tag color="orange">题目: {article.problem_title}</Tag>
            )}
          </Space>
          <Text strong style={{ fontSize: 16 }}>{article.title}</Text>
          {article.summary && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ marginBottom: 8, marginTop: 4 }}
            >
              {article.summary}
            </Paragraph>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Space size={4}>
          <Avatar size={20} src={article.author_avatar} />
          <Text type="secondary">{article.author_name}</Text>
          <Text type="secondary">{dayjs(article.created_at).format('YYYY-MM-DD')}</Text>
        </Space>
        <Space split="|" size={12}>
          <Text type="secondary"><EyeOutlined /> {article.views}</Text>
          <Text type="secondary"><HeartOutlined /> {article.like_count}</Text>
          <Text type="secondary"><MessageOutlined /> {article.comment_count}</Text>
          <Text type="secondary"><StarOutlined /> {article.favorite_count}</Text>
        </Space>
      </div>
    </Card>
  )
}

export default ArticleCard
