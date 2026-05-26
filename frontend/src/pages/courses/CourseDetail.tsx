import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Button, List, Tag, Progress, Tabs, Space, Divider, Avatar, Modal, message, Upload } from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BookOutlined,
  UploadOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { courseService } from '../../services/course.service'
import type { Course, Lesson, CourseMaterial } from '../../types/course'

const { Dragger } = Upload

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [pptModalVisible, setPptModalVisible] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const [courseData, lessonsData, progressData] = await Promise.all([
        courseService.getCourseWithLessons(Number(id)),
        courseService.getLessonsByCourse(Number(id)),
        courseService.getCourseProgress(Number(id)),
      ])
      setCourse(courseData)
      setLessons(lessonsData)
      setProgress(progressData)
    } catch (error) {
      message.error('获取课程数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCourseData()
    }
  }, [id])

  const handleLessonClick = async (lesson: Lesson) => {
    try {
      const lessonData = await courseService.getLessonById(lesson.id)
      setCurrentLesson(lessonData)
    } catch (error) {
      message.error('获取课次详情失败')
    }
  }

  const handleLessonComplete = async (lessonId: number, completed: boolean) => {
    try {
      await courseService.updateLessonProgress(lessonId, { completed })
      await fetchCourseData() // 刷新进度
      message.success('学习进度已更新')
    } catch (error) {
      message.error('更新进度失败')
    }
  }

  const playVideo = (_material: CourseMaterial) => {
    setCurrentLesson(prev => prev ? prev : lessons[0])
    setVideoModalVisible(true)
  }

  const viewPpt = (_material: CourseMaterial) => {
    setPptModalVisible(true)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a'
    if (percentage >= 50) return '#1890ff'
    return '#faad14'
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraOutlined />
      case 'ppt': return <FileTextOutlined />
      case 'document': return <BookOutlined />
      default: return <FileTextOutlined />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'video': return '#1890ff'
      case 'ppt': return '#ff4d4f'
      case 'document': return '#52c41a'
      default: 'default'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '未知大小'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!course) {
    return <div>加载中...</div>
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/courses')}
        >
          返回课程列表
        </Button>
      </Space>

      <Card loading={loading}>
        {/* 课程头部 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>{course.title}</Title>
          <Paragraph>{course.description}</Paragraph>
          <Space>
            <Tag color="blue">
              <VideoCameraOutlined /> {lessons.length} 课时
            </Tag>
            {progress && (
              <div style={{ width: 200 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">学习进度</Text>
                  <Text strong style={{ marginLeft: 8 }}>
                    {progress.completed_count}/{progress.total_count}
                  </Text>
                </div>
                <Progress
                  percent={progress.progress_percentage}
                  strokeColor={getProgressColor(progress.progress_percentage)}
                  size="small"
                />
              </div>
            )}
          </Space>
        </div>

        <Divider />

        {/* 课次列表 */}
        <div>
          <Title level={4}>课程内容</Title>
          <List
            dataSource={lessons}
            renderItem={(lesson) => (
              <List.Item
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                style={{
                  padding: '16px',
                  marginBottom: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical">
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {lesson.title}
                        </Text>
                        {currentLesson?.id === lesson.id && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            当前
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        <ClockCircleOutlined /> 预计 {lesson.duration || 30}分钟
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
                        • 知识点：{lesson.knowledge_point}
                      </Text>
                    </Space>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLessonClick(lesson)
                      }}
                    >
                      学习
                    </Button>
                  </Space>
                </div>
              </List.Item>
            )}
          />
        </div>
      </Card>

      {/* 当前课次详情和资源 */}
      {currentLesson && (
        <Card style={{ marginTop: 16 }} title={currentLesson.title}>
          <Tabs defaultActiveKey="description">
            <TabPane tab="课次简介" key="description">
              <Paragraph>{currentLesson.description}</Paragraph>
              <div>
                <Text strong>知识点：</Text>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {currentLesson.knowledge_point}
                </Tag>
              </div>
            </TabPane>

            <TabPane tab="学习资源" key="resources">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                >
                  上传学习资源
                </Button>
                {(currentLesson as any).materials && (currentLesson as any).materials.length > 0 ? (
                  (currentLesson as any).materials.map((material: any) => (
                    <Card
                      key={material.id}
                      size="small"
                      hoverable
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Space>
                        <Avatar
                          icon={getFileIcon(material.type)}
                          style={{
                            backgroundColor: getFileTypeColor(material.type),
                            color: 'white',
                          }}
                        />
                        <div>
                          <Text strong>{material.title}</Text>
                          {material.file_name && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {material.file_name} • {formatFileSize(material.file_size || 0)}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Space>
                      <Space>
                        {material.type === 'video' && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => playVideo(material)}
                          >
                            播放
                          </Button>
                        )}
                        {material.type === 'ppt' && (
                          <Button
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => viewPpt(material)}
                          >
                            查看
                          </Button>
                        )}
                      </Space>
                    </Card>
                  ))
                ) : (
                  <Text type="secondary">暂无学习资源</Text>
                )}
              </Space>
            </TabPane>

            <TabPane tab="学习进度" key="progress">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleLessonComplete(currentLesson.id, true)}
                  >
                    标记为已完成
                  </Button>
                  <Button
                    style={{ marginLeft: 8 }}
                    onClick={() => handleLessonComplete(currentLesson.id, false)}
                  >
                    标记为未完成
                  </Button>
                </div>
                <Divider />
                <Text type="secondary">
                  点击上方按钮来标记您的学习进度。完成的课次将在课程进度中显示。
                </Text>
              </Space>
            </TabPane>
          </Tabs>
        </Card>
      )}

      {/* 视频播放模态框 */}
      <Modal
        title="视频播放"
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        width="80%"
        footer={null}
      >
        <div style={{ textAlign: 'center' }}>
          <video
            controls
            style={{ width: '100%', maxHeight: '70vh' }}
            controlsList="nodownload"
          >
            <source
              src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
            您的浏览器不支持视频播放。
          </video>
          <Paragraph style={{ marginTop: 16 }}>
            <Text type="secondary">
              当前为演示模式，使用示例视频。在实际应用中将播放课程视频。
            </Text>
          </Paragraph>
        </div>
      </Modal>

      {/* PPT查看模态框 */}
      <Modal
        title="课件查看"
        open={pptModalVisible}
        onCancel={() => setPptModalVisible(false)}
        width="80%"
        footer={null}
      >
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          padding: '40px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Text>课件查看器</Text>
            <Paragraph style={{ marginTop: 16 }}>
              <Text type="secondary">
                当前为演示模式。在实际应用中，这里将支持PPT/DOCX文档的在线查看和下载。
              </Text>
            </Paragraph>
          </div>
        </div>
      </Modal>

      {/* 文件上传模态框 */}
      <Modal
        title="上传学习资源"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Dragger
          name="file"
          multiple={false}
          action="http://localhost:5000/api/materials/upload"
          headers={{
            authorization: `Bearer ${localStorage.getItem('token')}`,
          }}
          onChange={(info) => {
            const { status } = info.file
            if (status === 'done') {
              message.success(`${info.file.name} 文件上传成功`)
              setUploadModalVisible(false)
              fetchCourseData()
            } else if (status === 'error') {
              message.error(`${info.file.name} 文件上传失败`)
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持上传视频(MP4)、PPT、PDF、文档等文件<br/>
            最大文件大小：100MB
          </p>
        </Dragger>
      </Modal>
    </div>
  )
}

export default CourseDetail