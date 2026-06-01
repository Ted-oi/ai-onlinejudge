import { Progress, Card, Typography, Space } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

interface CourseProgressChartProps {
  completed: number
  total: number
  courseTitle?: string
}

const CourseProgressChart = ({ completed, total, courseTitle }: CourseProgressChartProps) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card size="small">
      {courseTitle && <Text strong style={{ marginBottom: 8, display: 'block' }}>{courseTitle}</Text>}
      <Progress
        type="circle"
        percent={percent}
        format={() => `${percent}%`}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        size={80}
      />
      <div style={{ marginTop: 12 }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text>已完成 {completed}/{total} 课时</Text>
        </Space>
      </div>
    </Card>
  )
}

export default CourseProgressChart
