import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, Input, Select, Pagination, Button, Empty, Spin, Space } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, BookOutlined } from '@ant-design/icons'
import articleService from '../../services/article.service'
import ArticleCard from '../../components/articles/ArticleCard'
import type { Article } from '../../types/article'

const ArticleList = ({ type: propType, problemId: propProblemId }: { type?: string; problemId?: number } = {}) => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const type = propType || searchParams.get('type') || undefined
  const problemId = propProblemId || (searchParams.get('problem_id') ? Number(searchParams.get('problem_id')) : undefined)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('tags')?.split(',').filter(Boolean) || [])
  const [sort, setSort] = useState<string>(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])

  const limit = 10

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit, sort }
      if (type) params.type = type
      if (problemId) params.problem_id = problemId
      if (search) params.search = search
      if (selectedTags.length > 0) params.tags = selectedTags.join(',')

      const data = await articleService.getArticles(params)
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const tags = await articleService.getArticleTags()
      setAllTags(tags || [])
    } catch {}
  }

  useEffect(() => { fetchTags() }, [])
  useEffect(() => { fetchArticles() }, [page, sort, type, problemId])

  const handleSearch = () => {
    setPage(1)
    fetchArticles()
  }

  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags)
    setPage(1)
  }

  useEffect(() => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (sort !== 'newest') params.set('sort', sort)
    if (search) params.set('search', search)
    if (selectedTags.length) params.set('tags', selectedTags.join(','))
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [type, sort, search, selectedTags, page, setSearchParams])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {!propType && (
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate('/articles/create/blog')}
            >写博客</Button>
          )}
          {!propType && (
            <Button
              type="primary"
              icon={<BookOutlined />}
              onClick={() => navigate('/articles/create/solution')}
            >写题解</Button>
          )}
          {propType === 'solution' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/articles/create/solution')}>
              写题解
            </Button>
          )}
        </div>
      </div>

      {!propType && (
        <Tabs
          activeKey={type || 'all'}
          onChange={key => {
            const newType = key === 'all' ? undefined : key
            setPage(1)
            const params = new URLSearchParams(searchParams)
            if (newType) params.set('type', newType)
            else params.delete('type')
            setSearchParams(params, { replace: true })
          }}
          items={[
            { key: 'all', label: '全部' },
            { key: 'blog', label: '博客' },
            { key: 'solution', label: '题解' },
          ]}
        />
      )}

      <Space wrap style={{ marginBottom: 16, width: '100%' }}>
        <Input.Search
          placeholder="搜索文章..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={handleSearch}
          style={{ width: 280 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        {allTags.length > 0 && (
          <Select
            mode="multiple"
            placeholder="标签筛选"
            value={selectedTags}
            onChange={handleTagChange}
            style={{ minWidth: 200 }}
            options={allTags.map(t => ({ label: t, value: t }))}
            allowClear
          />
        )}
        <Select value={sort} onChange={v => { setSort(v); setPage(1) }} style={{ width: 140 }}>
          <Select.Option value="newest">最新发布</Select.Option>
          <Select.Option value="most_liked">最多点赞</Select.Option>
          <Select.Option value="most_viewed">最多浏览</Select.Option>
        </Select>
      </Space>

      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : articles.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <>
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {total > limit && (
            <Pagination
              current={page}
              total={total}
              pageSize={limit}
              onChange={p => setPage(p)}
              style={{ textAlign: 'center', marginTop: 16 }}
              showTotal={t => `共 ${t} 篇`}
            />
          )}
        </>
      )}
    </div>
  )
}

export default ArticleList
