import { Skeleton, Card } from 'antd'

interface LoadingSkeletonProps {
  type?: 'list' | 'detail' | 'card' | 'code' | 'table'
  count?: number
}

const LoadingSkeleton = ({ type = 'list', count = 5 }: LoadingSkeletonProps) => {
  if (type === 'list') {
    return (
      <div>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    )
  }

  if (type === 'code') {
    return <Skeleton active paragraph={{ rows: 12 }} />
  }

  if (type === 'table') {
    return <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
  }

  return <Skeleton active paragraph={{ rows: 6 }} />
}

export default LoadingSkeleton
