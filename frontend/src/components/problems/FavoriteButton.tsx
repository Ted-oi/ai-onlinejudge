import { useState, useEffect } from 'react'
import { Button, Tooltip, message } from 'antd'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import { problemService } from '../../services/problem.service'

interface FavoriteButtonProps {
  problemId: number
}

const FavoriteButton = ({ problemId }: FavoriteButtonProps) => {
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    problemService.checkFavorite(problemId).then(data => {
      setFavorited(data.favorited)
    }).catch(() => {})
  }, [problemId])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const data = await problemService.toggleFavorite(problemId)
      setFavorited(data.favorited)
      message.success(data.favorited ? '已收藏' : '已取消收藏')
    } catch {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tooltip title={favorited ? '取消收藏' : '收藏题目'}>
      <Button
        type="text"
        icon={favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
        onClick={handleToggle}
        loading={loading}
      />
    </Tooltip>
  )
}

export default FavoriteButton
