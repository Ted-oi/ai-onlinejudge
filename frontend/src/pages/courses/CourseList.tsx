import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Tag, Button } from 'antd'
import { PlayCircleOutlined, FileTextOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { courseService } from '../../services/course.service'
import type { Course } from '../../types/course'

const { Title, Text, Paragraph } = Typography

const CourseList = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const navigate = useNavigate()

  const fetchCourses = async () => {
    try {
      const data = await courseService.getCourses()
      setCourses(data)
    } catch (error) {
      console.error('获取课程列表失败:', error)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const getCategoryColor = (category: string) => {
    const colors: any = {
      '语法基础': 'cyan',
      '算法基础': 'purple',
      '数据结构': 'green',
      '动态规划': 'blue',
    }
    return colors[category] || 'default'
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={2}>课程学习</Title>
        <Paragraph>系统提供丰富的编程课程资源，帮助您系统化学习编程知识。</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} lg={8} key={course.id}>
            <Card
              hoverable
              onClick={() => navigate(`/courses/${course.id}`)}
              cover={
                <div
                  style={{
                    height: 180,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: 'white',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                  <Title level={3} style={{ color: 'white', margin: 0 }}>
                    {course.title}
                  </Title>
                </div>
              }
            >
              <div style={{ marginBottom: 12 }}>
                <Tag color={getCategoryColor(course.category)}>
                  {course.category}
                </Tag>
              </div>
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 16 }}
              >
                {course.description}
              </Paragraph>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  <VideoCameraOutlined /> {course.lessons_count || 0} 课时
                </Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/courses/${course.id}`)
                  }}
                >
                  开始学习
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default CourseList