import { Card, Typography, Tag } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { ProblemCategory } from '../../types/problem'

const { Text, Paragraph } = Typography

interface CategoryTooltipProps {
  category: ProblemCategory
  problemCount?: number
}

const CategoryTooltip: React.FC<CategoryTooltipProps> = ({ category, problemCount = 0 }) => {
  return (
    <Card
      size="small"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        width: 280,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>{category.name}</Text>
        {problemCount > 0 && (
          <Tag color={category.section === 'syntax' ? 'cyan' : 'purple'} style={{ marginLeft: 8 }}>
            {problemCount} 道题
          </Tag>
        )}
      </div>

      {category.description && (
        <Paragraph style={{ marginBottom: 8, color: '#666' }}>
          {category.description}
        </Paragraph>
      )}

      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          点击筛选此分类的题目
        </Text>
      </div>
    </Card>
  )
}

export default CategoryTooltip