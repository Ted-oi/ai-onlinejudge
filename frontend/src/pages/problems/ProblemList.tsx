import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Typography, Tabs, message } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'
import { PROBLEM_CATEGORIES, ProblemCategory } from '../../types/problem'
import { useTheme } from '../../components/common/ThemeSwitcher'

const { Title, Text } = Typography
const { Option } = Select

const sectionConfig: Record<string, { emoji: string; label: string; color: string; activeBg: string; activeBorder: string }> = {
  syntax: { emoji: '🔤', label: '语法基础', color: '#0891b2', activeBg: '#ecfeff', activeBorder: '#a5f3fc' },
  algorithm: { emoji: '🧩', label: '算法基础（入门级）', color: '#7c3aed', activeBg: '#f5f3ff', activeBorder: '#c4b5fd' },
  algorithm_advanced: { emoji: '🏆', label: '算法提高（提高级）', color: '#dc2626', activeBg: '#fef2f2', activeBorder: '#fca5a5' },
}

const ProblemList = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])

  const [problems, setProblems] = useState<Problem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ difficulty: '', category: '', search: '' })
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [allProblems, setAllProblems] = useState<Problem[]>([])
  const [activeTab, setActiveTab] = useState<string>('coding')

  const fetchProblems = useCallback(async (type?: string) => {
    try {
      setLoading(true)
      const pt = type || activeTab
      const queryObj = pt === 'objective' ? { ...filters, limit: 200, problem_type: 'objective' as const } : { ...filters, limit: 200 }
      const { problems: data, total } = await problemService.getProblems(queryObj)
      const processedData = data.map((problem: Problem) => ({
        ...problem,
        examples: Array.isArray(problem.examples) ? problem.examples : []
      }))
      setProblems(processedData)
      setTotalCount(total)
      if (!filters.category && !filters.difficulty && !filters.search && pt !== 'objective') {
        setAllProblems(processedData)
      }
    } catch { message.error('获取题目列表失败') } finally { setLoading(false) }
  }, [filters.category, filters.difficulty, filters.search, activeTab])

  useEffect(() => { fetchProblems() }, [fetchProblems])

  useEffect(() => {
    const timer = setTimeout(() => {
      // Strip P prefix for ID search: "P0001" -> "1", "P445" -> "445"
      const trimmed = searchInput.trim()
      const cleaned = /^p(\d+)$/i.test(trimmed) ? trimmed.replace(/^p/i, '') : trimmed
      setFilters(prev => ({ ...prev, search: cleaned }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory('')
      setFilters({ ...filters, category: '' })
    } else {
      setSelectedCategory(categoryId)
      setFilters({ ...filters, category: categoryId })
    }
  }

  const formatProblemId = (no: number) => `P${String(no).padStart(4, '0')}`

  const columns = [
    {
      title: 'ID', dataIndex: 'problem_no', key: 'id', width: 80,
      render: (no: number) => <Text code style={{ fontSize: 12 }}>{formatProblemId(no)}</Text>,
    },
    {
      title: '标题', dataIndex: 'title', key: 'title',
      render: (text: string, record: Problem) => (
        <a onClick={() => navigate(`/problems/${record.id}`)} style={{ fontWeight: 500 }}>{text}</a>
      ),
    },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 80,
      render: (difficulty: string) => {
        const config: Record<string, { color: string; bg: string; label: string }> = {
          easy: { color: '#10b981', bg: '#ecfdf5', label: '简单' },
          medium: { color: '#f59e0b', bg: '#fffbeb', label: '中等' },
          hard: { color: '#ef4444', bg: '#fef2f2', label: '困难' },
        }
        const c = config[difficulty]
        if (!c) return <Tag>{difficulty}</Tag>
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: isDark ? `${c.color}22` : c.bg,
            color: c.color, lineHeight: '20px',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
            {c.label}
          </span>
        )
      },
    },
    {
      title: '标签', dataIndex: 'categories', key: 'categories', width: 160,
      render: (categories: string[]) => {
        if (!categories || categories.length === 0) return <Text type="secondary" style={{ fontSize: 12 }}>未分类</Text>
        return (
          <Space size={3}>
            {categories.slice(0, 2).map(cat => {
              const category = PROBLEM_CATEGORIES.find(c => c.id === cat)
              const sec = sectionConfig[category?.section || 'syntax']
              return (
                <span key={cat} style={{
                  padding: '1px 6px', borderRadius: 4, fontSize: 11, lineHeight: '18px',
                  background: isDark ? `${sec?.color}18` : `${sec?.color}10`,
                  color: sec?.color, fontWeight: 500,
                }}>
                  {category?.name || cat}
                </span>
              )
            })}
            {categories.length > 2 && (
              <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.3)' : '#999' }}>
                +{categories.length - 2}
              </span>
            )}
          </Space>
        )
      },
    },
    { title: '时限', dataIndex: 'time_limit', key: 'time_limit', width: 80, render: (t: number) => <Text type="secondary" style={{ fontSize: 12 }}>{t}ms</Text> },
    { title: '内存', dataIndex: 'memory_limit', key: 'memory_limit', width: 80, render: (m: number) => <Text type="secondary" style={{ fontSize: 12 }}>{m}MB</Text> },
  ]

  const objectiveColumns = [
    {
      title: 'ID', dataIndex: 'problem_no', key: 'id', width: 80,
      render: (no: number) => <Text code style={{ fontSize: 12 }}>{formatProblemId(no)}</Text>,
    },
    {
      title: '标题', dataIndex: 'title', key: 'title',
      render: (text: string, record: Problem) => (
        <a onClick={() => navigate(`/problems/${record.id}`)} style={{ fontWeight: 500 }}>{text}</a>
      ),
    },
    {
      title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 80,
      render: (difficulty: string) => {
        const config: Record<string, { color: string; bg: string; label: string }> = {
          easy: { color: '#10b981', bg: '#ecfdf5', label: '简单' },
          medium: { color: '#f59e0b', bg: '#fffbeb', label: '中等' },
          hard: { color: '#ef4444', bg: '#fef2f2', label: '困难' },
        }
        const c = config[difficulty]
        if (!c) return <Tag>{difficulty}</Tag>
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: isDark ? `${c.color}22` : c.bg, color: c.color, lineHeight: '20px',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
            {c.label}
          </span>
        )
      },
    },
    {
      title: '题型', key: 'obj_type', width: 90,
      render: (_: any, record: Problem) => {
        const t = record.objective_data?.type
        return t === 'choice'
          ? <Tag color="purple">单选题</Tag>
          : <Tag color="cyan">判断题</Tag>
      },
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, record: Problem) => (
        <Button type="primary" size="small" onClick={() => navigate(`/problems/${record.id}/answer`)}>
          开始答题
        </Button>
      ),
    },
  ]

  const categoriesBySection = PROBLEM_CATEGORIES.reduce((acc, category) => {
    if (!acc[category.section]) acc[category.section] = []
    acc[category.section].push(category)
    return acc
  }, {} as Record<string, ProblemCategory[]>)

  const renderSection = (sectionKey: string) => {
    const config = sectionConfig[sectionKey]
    if (!config) return null
    const categories = categoriesBySection[sectionKey]
    if (!categories?.length) return null

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          color: isDark ? config.color : config.color,
        }}>
          <span style={{ fontSize: 14 }}>{config.emoji}</span>
          {config.label}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map(category => {
            const count = allProblems.filter(p => p.categories?.includes(category.id)).length
            const isActive = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 14, fontSize: 12,
                    lineHeight: '20px', cursor: 'pointer', transition: 'all 0.2s',
                    border: `1px solid ${isActive
                      ? config.color
                      : isDark ? '#404040' : '#e5e7eb'}`,
                    background: isActive
                      ? (isDark ? `${config.color}25` : config.activeBg)
                      : (isDark ? '#2a2a2a' : '#fff'),
                    color: isActive ? config.color : (isDark ? 'rgba(255,255,255,0.65)' : '#555'),
                    fontWeight: isActive ? 600 : 400,
                    boxShadow: isActive ? `0 0 0 1px ${config.color}30` : 'none',
                    outline: 'none',
                  }}
                >
                  {category.name}
                  <span style={{
                    fontSize: 10, fontWeight: 500,
                    color: isActive ? config.color : (isDark ? 'rgba(255,255,255,0.25)' : '#aaa'),
                    background: isActive
                      ? (isDark ? `${config.color}20` : `${config.color}12`)
                      : (isDark ? '#333' : '#f3f4f6'),
                    padding: '0 5px', borderRadius: 8, lineHeight: '16px',
                  }}>
                    {count}
                  </span>
                </button>
            )
          })}
        </div>
      </div>
    )
  }

  const cardBg = isDark ? '#1f1f1f' : '#fff'
  const cardBorder = isDark ? '#303030' : '#f0f0f0'

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>题库</Title>
        {(user.role === 'admin' || user.role === 'teacher') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/problems/create')}>
            添加题目
          </Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setSelectedCategory(''); setFilters({ ...filters, category: '' }); fetchProblems(key); }} items={[
        { key: 'coding', label: '编程题' },
        { key: 'objective', label: '客观题' },
      ]} style={{ marginBottom: 12 }} />

      {/* 筛选 — only for coding */}
      {activeTab === 'coding' && (
      <Card style={{ marginBottom: 12, background: cardBg, borderColor: cardBorder }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索题名或 ID"
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select value={filters.difficulty || ''} onChange={v => setFilters({ ...filters, difficulty: v })} style={{ width: 120 }}>
            <Option value="">全部难度</Option>
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
        </Space>
      </Card>
      )}

      {/* 标签分类 — only for coding */}
      {activeTab === 'coding' && (
      <Card style={{ marginBottom: 12, background: cardBg, borderColor: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13 }}>快速筛选</Text>
          <button
            onClick={() => { setSelectedCategory(''); setFilters({ ...filters, category: '' }) }}
            style={{
              padding: '3px 10px', borderRadius: 14, fontSize: 12, lineHeight: '20px',
              cursor: 'pointer', border: `1px solid ${selectedCategory === '' ? '#4f46e5' : (isDark ? '#404040' : '#e5e7eb')}`,
              background: selectedCategory === '' ? (isDark ? '#4f46e525' : '#eef2ff') : (isDark ? '#2a2a2a' : '#fff'),
              color: selectedCategory === '' ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.65)' : '#555'),
              fontWeight: selectedCategory === '' ? 600 : 400,
              outline: 'none', transition: 'all 0.2s',
            }}
          >
            全部 <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.25)' : '#aaa', marginLeft: 2 }}>{totalCount}</span>
          </button>
        </div>
        {renderSection('syntax')}
        {renderSection('algorithm')}
        {renderSection('algorithm_advanced')}
      </Card>
      )}

      {/* 当前筛选提示 — only for coding */}
      {activeTab === 'coding' && selectedCategory && (
        <div style={{
          marginBottom: 12, padding: '8px 16px', borderRadius: 8,
          background: isDark ? '#1f1f1f' : '#f0f7ff', border: `1px solid ${isDark ? '#303030' : '#d6e4ff'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Text style={{ fontSize: 13 }}>当前筛选：</Text>
          <Tag color="blue" closable onClose={() => handleCategoryClick('')} style={{ margin: 0 }}>
            {PROBLEM_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {problems.filter(p => p.categories?.includes(selectedCategory)).length} 道题
          </Text>
          <Button type="link" size="small" onClick={() => handleCategoryClick('')}>清除</Button>
        </div>
      )}

      {/* 题目表格 */}
      <Card style={{ background: cardBg, borderColor: cardBorder }}>
        <Table
          columns={activeTab === 'objective' ? objectiveColumns : columns}
          dataSource={problems}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 道题目`,
          }}
        />
      </Card>
    </div>
  )
}

export default ProblemList
