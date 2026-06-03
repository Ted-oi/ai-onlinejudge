import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Button, List, Tag, Progress, Space, Divider, Modal, message } from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { courseService } from '../../services/course.service'
import LoadingSkeleton from '../../components/common/LoadingSkeleton'
import api from '../../services/api'
import type { Course, CourseMaterial } from '../../types/course'

const { Title, Text, Paragraph } = Typography

const API_BASE = ''

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [pptModalVisible, setPptModalVisible] = useState(false)
  const [problemSet, setProblemSet] = useState<any>(null)

  const fetchCourseData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [courseRes, lessonsData, progressData] = await Promise.all([
        api.get(`/courses/${id}`),
        courseService.getLessonsByCourse(Number(id)),
        courseService.getCourseProgress(Number(id)),
      ])
      const courseData = courseRes.data.data.course
      const psData = courseRes.data.data.problemSet
      setCourse(courseData)
      setProgress(progressData)
      setProblemSet(psData || null)

      const lessonsWithMaterials = await Promise.all(
        (lessonsData || []).map(async (lesson: any) => {
          try {
            const detail = await courseService.getLessonById(lesson.id)
            return { ...lesson, materials: detail.materials || [] }
          } catch {
            return { ...lesson, materials: [] }
          }
        })
      )
      setLessons(lessonsWithMaterials)
    } catch {
      message.error('获取课程数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCourseData() }, [id])

  const handleLessonComplete = async (lessonId: number, completed: boolean) => {
    try {
      await courseService.updateLessonProgress(lessonId, { completed })
      await fetchCourseData()
      message.success('学习进度已更新')
    } catch {
      message.error('更新进度失败')
    }
  }

  const playVideo = (e: React.MouseEvent, material: CourseMaterial) => {
    e.stopPropagation()
    setSelectedMaterial(material)
    setVideoModalVisible(true)
  }

  const viewPpt = (e: React.MouseEvent, material: CourseMaterial) => {
    e.stopPropagation()
    setSelectedMaterial(material)
    setPptModalVisible(true)
  }

  const getFileUrl = (material: CourseMaterial) => {
    if (!material.file_url) return ''
    if (material.file_url.startsWith('http')) return material.file_url
    return `${API_BASE}${material.file_url}`
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#52c41a'
    if (percentage >= 50) return '#1890ff'
    return '#faad14'
  }

  if (!course) return <Card style={{ margin: 24 }}><LoadingSkeleton type="detail" /></Card>

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/courses')}>
          返回课程列表
        </Button>
      </Space>

      {/* 课程信息 */}
      <Card loading={loading}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>{course.title}</Title>
          <Paragraph>{course.description}</Paragraph>
          <Space>
            <Tag color="blue"><VideoCameraOutlined /> {lessons.length} 课时</Tag>
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

        {problemSet && (
          <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <Space direction="vertical" size={4}>
                <Space>
                  <UnorderedListOutlined />
                  <Text strong>配套题单：{problemSet.title}</Text>
                </Space>
                <Text type="secondary">
                  已完成 {problemSet.solved_count}/{problemSet.total_count} 题
                </Text>
              </Space>
              <Space>
                <div style={{ width: 120 }}>
                  <Progress
                    percent={problemSet.percentage}
                    size="small"
                    strokeColor={problemSet.percentage >= 100 ? '#52c41a' : '#1890ff'}
                  />
                </div>
                <Button
                  type="primary"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  onClick={() => navigate(`/problem-sets/${problemSet.id}`)}
                >
                  进入题单
                </Button>
              </Space>
            </div>
          </Card>
        )}

        <Divider />

        {/* 课时列表 —— 每个课时直接显示播放/查看按钮 */}
        <Title level={4}>课程内容</Title>
        <List
          dataSource={lessons}
          renderItem={(lesson: any) => {
            const mats: any[] = lesson.materials || []
            const videos = mats.filter((m: any) => m.type === 'video')
            const docs = mats.filter((m: any) => m.type === 'ppt' || m.type === 'document')

            return (
              <Card
                key={lesson.id}
                size="small"
                style={{ marginBottom: 12, borderRadius: 8 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Space direction="vertical" size={4}>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{lesson.title}</Text>
                        {lesson.knowledge_point && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>{lesson.knowledge_point}</Tag>
                        )}
                      </div>
                      <Space size={16}>
                        <Text type="secondary"><ClockCircleOutlined /> {lesson.duration || 30}分钟</Text>
                        {mats.length > 0 && (
                          <Text type="secondary"><FileTextOutlined /> {mats.length} 个资源</Text>
                        )}
                      </Space>
                    </Space>
                  </div>

                  {/* 直接在课时卡片上放播放/查看按钮 */}
                  <Space>
                    {videos.map((m: any) => (
                      <Button
                        key={m.id}
                        size="small"
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => playVideo(e, m)}
                      >
                        播放视频
                      </Button>
                    ))}
                    {docs.map((m: any) => (
                      <Button
                        key={m.id}
                        size="small"
                        icon={m.type === 'ppt' ? <FileTextOutlined /> : <FilePdfOutlined />}
                        onClick={(e) => viewPpt(e, m)}
                      >
                        {m.type === 'ppt' ? '查看课件' : '查看文档'}
                      </Button>
                    ))}
                    {mats.length === 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>暂无资源</Text>
                    )}
                    <Button
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={(e) => { e.stopPropagation(); handleLessonComplete(lesson.id, true) }}
                    >
                      完成
                    </Button>
                  </Space>
                </div>
              </Card>
            )
          }}
        />
      </Card>

      {/* 视频播放 */}
      <Modal
        title={`视频播放 - ${selectedMaterial?.title || ''}`}
        open={videoModalVisible}
        onCancel={() => { setVideoModalVisible(false); setSelectedMaterial(null) }}
        width="80%"
        footer={null}
        destroyOnClose
      >
        {selectedMaterial?.file_url ? (
          <video
            key={selectedMaterial.id}
            controls
            style={{ width: '100%', maxHeight: '70vh' }}
            controlsList="nodownload"
          >
            <source src={getFileUrl(selectedMaterial)} type={selectedMaterial.mime_type || 'video/mp4'} />
            您的浏览器不支持视频播放。
          </video>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">暂无可播放的视频文件</Text>
          </div>
        )}
      </Modal>

      {/* PPT/文档查看 */}
      <Modal
        title={`文档查看 - ${selectedMaterial?.title || ''}`}
        open={pptModalVisible}
        onCancel={() => { setPptModalVisible(false); setSelectedMaterial(null) }}
        width="85%"
        footer={null}
        destroyOnClose
      >
        {selectedMaterial?.file_url ? (
          selectedMaterial.mime_type === 'application/pdf' ? (
            <iframe
              key={selectedMaterial.id}
              src={getFileUrl(selectedMaterial)}
              style={{ width: '100%', height: '75vh', border: 'none' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Paragraph>该文件格式不支持在线预览，请下载后查看</Paragraph>
              <Button type="primary" icon={<DownloadOutlined />} href={getFileUrl(selectedMaterial)} target="_blank" size="large">
                下载文件
              </Button>
              <Paragraph style={{ marginTop: 16 }}>
                <Text type="secondary">{selectedMaterial.file_name}</Text>
              </Paragraph>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">暂无可查看的文件</Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CourseDetail
