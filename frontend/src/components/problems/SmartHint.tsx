import { useState } from 'react'
import { Card, Button, Steps, Typography, Space, Spin } from 'antd'
import { BulbOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { aiService } from '../../services/ai.service'

const { Text, Paragraph } = Typography

interface SmartHintProps {
  problemId: number
}

const SmartHint = ({ problemId }: SmartHintProps) => {
  const [hints, setHints] = useState<string[]>([])
  const [currentLevel, setCurrentLevel] = useState(0)
  const [loading, setLoading] = useState(false)

  const getHint = async (level: number) => {
    if (hints[level - 1]) {
      setCurrentLevel(level)
      return
    }
    setLoading(true)
    try {
      const data = await aiService.getHint({ problem_id: problemId, level })
      setHints(prev => {
        const newHints = [...prev]
        newHints[level - 1] = data.hint
        return newHints
      })
      setCurrentLevel(level)
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={<Space><BulbOutlined /> 智能提示</Space>}
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Steps
        current={currentLevel - 1}
        size="small"
        items={[
          { title: '方向提示' },
          { title: '方法提示' },
          { title: '思路提示' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {currentLevel > 0 && hints[currentLevel - 1] && (
        <Paragraph style={{ background: '#fffbe6', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          {hints[currentLevel - 1]}
        </Paragraph>
      )}

      {loading && <Spin style={{ display: 'block', margin: '12px auto' }} />}

      <Space>
        {!loading && currentLevel < 3 && (
          <Button
            type={currentLevel === 0 ? 'primary' : 'default'}
            onClick={() => getHint(currentLevel + 1)}
          >
            获取第 {currentLevel + 1} 级提示 <ArrowRightOutlined />
          </Button>
        )}
        {currentLevel === 3 && <Text type="secondary">已显示最详细的提示</Text>}
      </Space>
    </Card>
  )
}

export default SmartHint
