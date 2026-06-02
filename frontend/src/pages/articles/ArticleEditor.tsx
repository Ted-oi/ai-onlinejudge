import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Input, Select, Button, Space, Radio, Typography, Spin, message } from 'antd'
import MonacoEditor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import articleService from '../../services/article.service'

const { TextArea } = Input
const { Title } = Typography

const ArticleEditor = () => {
  const { id, type: urlType } = useParams<{ id: string; type: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [articleType, setArticleType] = useState<'blog' | 'solution'>(urlType === 'solution' ? 'solution' : 'blog')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [problemId, setProblemId] = useState<number | undefined>()
  const [allTags, setAllTags] = useState<string[]>([])
  const [problems, setProblems] = useState<any[]>([])
  const [problemSearch, setProblemSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    articleService.getArticleTags().then(t => setAllTags(t || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (problemSearch.length >= 1) {
      const timer = setTimeout(() => {
        fetch(`/api/problems?search=${encodeURIComponent(problemSearch)}&limit=10`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => setProblems(data.data?.problems || []))
          .catch(() => {})
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [problemSearch])

  useEffect(() => {
    if (isEdit) {
      articleService.getArticleById(Number(id)).then(data => {
        const a = data.article
        setArticleType(a.type)
        setTitle(a.title)
        setContent(a.content)
        setSummary(a.summary || '')
        setTags(a.tags || [])
        setProblemId(a.problem_id)
      }).catch(() => message.error('加载失败')).finally(() => setLoading(false))
    }
  }, [id])

  const handleSubmit = async () => {
    if (!title.trim()) return message.warning('请输入标题')
    if (!content.trim()) return message.warning('请输入内容')
    if (articleType === 'solution' && !problemId) return message.warning('题解必须关联题目')

    setSubmitting(true)
    try {
      if (isEdit) {
        await articleService.updateArticle(Number(id), { title, content, summary, tags })
        message.success('更新成功，等待审核')
      } else {
        await articleService.createArticle({ type: articleType, title, content, summary, tags, problem_id: problemId })
        message.success('提交成功，等待审核')
      }
      navigate('/my-articles')
    } catch {
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />

  return (
    <div>
      <Title level={4}>{isEdit ? '编辑文章' : '写文章'}</Title>

      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {!isEdit && (
          <Radio.Group value={articleType} onChange={e => setArticleType(e.target.value)}>
            <Radio.Button value="blog">博客</Radio.Button>
            <Radio.Button value="solution">题解</Radio.Button>
          </Radio.Group>
        )}

        <Input
          placeholder="文章标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ fontSize: 18 }}
        />

        {articleType === 'solution' && (
          <Select
            showSearch
            placeholder="选择关联题目"
            value={problemId}
            onChange={setProblemId}
            onSearch={setProblemSearch}
            filterOption={false}
            style={{ width: '100%' }}
            options={problems.map(p => ({ label: `${p.id}. ${p.title}`, value: p.id }))}
            notFoundContent={problemSearch ? '未找到题目' : '输入搜索题目'}
          />
        )}

        <TextArea
          placeholder="文章摘要（可选，最多500字）"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={2}
          maxLength={500}
          showCount
        />

        <Select
          mode="tags"
          placeholder="添加标签"
          value={tags}
          onChange={setTags}
          style={{ width: '100%' }}
          options={allTags.map(t => ({ label: t, value: t }))}
          tokenSeparators={[',']}
        />

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
              <MonacoEditor
                height="500px"
                language="markdown"
                theme="vs-dark"
                value={content}
                onChange={v => setContent(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6, padding: 16, overflowY: 'auto', maxHeight: 532 }}>
            <div style={{ lineHeight: 1.8 }}>
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown>
              ) : (
                <span style={{ color: '#999' }}>预览区域 — 在左侧编辑器中输入 Markdown 内容</span>
              )}
            </div>
          </div>
        </div>

        <Space>
          <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
            {isEdit ? '更新并提交审核' : '提交审核'}
          </Button>
          <Button size="large" onClick={() => navigate(-1)}>取消</Button>
        </Space>
      </Space>
    </div>
  )
}

export default ArticleEditor
