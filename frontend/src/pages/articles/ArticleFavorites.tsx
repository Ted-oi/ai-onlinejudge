import { useState, useEffect } from 'react'
import { Typography, Empty, Spin, Pagination } from 'antd'
import articleService from '../../services/article.service'
import ArticleCard from '../../components/articles/ArticleCard'
import type { Article } from '../../types/article'

const { Title } = Typography

const ArticleFavorites = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const data = await articleService.getUserFavorites({ page, limit: 10 })
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFavorites() }, [page])

  return (
    <div>
      <Title level={4}>收藏的文章</Title>
      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : articles.length === 0 ? (
        <Empty description="暂无收藏" />
      ) : (
        <>
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {total > 10 && (
            <Pagination
              current={page}
              total={total}
              pageSize={10}
              onChange={setPage}
              style={{ textAlign: 'center', marginTop: 16 }}
              showTotal={t => `共 ${t} 篇`}
            />
          )}
        </>
      )}
    </div>
  )
}

export default ArticleFavorites
