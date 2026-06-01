import { Skeleton } from 'antd'

interface LoadingSkeletonProps {
  type?: 'list' | 'detail' | 'card' | 'code'
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
          <Skeleton key={i} active paragraph={{ rows: 3 }} />
        ))}
      </div>
    )
  }

  if (type === 'code') {
    return <Skeleton active paragraph={{ rows: 12 }} />
  }

  return <Skeleton active paragraph={{ rows: 6 }} />
}

export default LoadingSkeleton
