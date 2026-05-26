import { Row, Col, Card, Statistic, Button, Typography } from 'antd'
import {
  CodeOutlined,
  TrophyOutlined,
  BookOutlined,
  RobotOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph } = Typography

const Home = () => {
  const navigate = useNavigate()

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px 24px',
          borderRadius: 8,
          marginBottom: 24,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Title level={1} style={{ color: 'white' }}>
          AI OnlineJudge
        </Title>
        <Paragraph style={{ color: 'white', fontSize: '18px', marginBottom: 32 }}>
          面向信息学竞赛的智能在线评测系统，集成AI助手，让编程学习更高效
        </Paragraph>
        <Button
          type="primary"
          size="large"
          icon={<CodeOutlined />}
          onClick={() => navigate('/problems')}
        >
          开始刷题
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="题目总数"
              value={1000}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={5000}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={50}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="AI对话"
              value={10000}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={8}>
          <Card
            title="题目练习"
            extra={<CodeOutlined />}
            hoverable
            onClick={() => navigate('/problems')}
            style={{ cursor: 'pointer' }}
          >
            <Paragraph>
              丰富的题目库，涵盖多种难度和类型，支持实时评测，让你快速提升编程能力
            </Paragraph>
            <Button type="link" icon={<ArrowRightOutlined />}>
              开始练习
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="在线比赛"
            extra={<TrophyOutlined />}
            hoverable
            onClick={() => navigate('/contests')}
            style={{ cursor: 'pointer' }}
          >
            <Paragraph>
              参加在线编程比赛，与其他选手同台竞技，实时查看排名，挑战自我
            </Paragraph>
            <Button type="link" icon={<ArrowRightOutlined />}>
              查看比赛
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="AI助手"
            extra={<RobotOutlined />}
            hoverable
            onClick={() => navigate('/ai')}
            style={{ cursor: 'pointer' }}
          >
            <Paragraph>
              智能AI助手，帮助你理解题目、分析代码、优化算法，提供个性化的学习指导
            </Paragraph>
            <Button type="link" icon={<ArrowRightOutlined />}>
              开始对话
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home