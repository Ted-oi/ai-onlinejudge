import { useState, useEffect, useCallback, useMemo } from 'react'
import { Table, Card, Input, Select, Button, Tag, Space, Typography, Tooltip, Divider, message } from 'antd'
import { SearchOutlined, PlusOutlined, AppstoreOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { problemService } from '../../services/problem.service'
import type { Problem } from '../../types'
import { PROBLEM_CATEGORIES, ProblemCategory } from '../../types/problem'
import CategoryTooltip from '../../components/problems/CategoryTooltip'

const { Title, Text } = Typography
const { Option } = Select

const ProblemList = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    search: '',
  })
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const navigate = useNavigate()
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])

  const [allProblems, setAllProblems] = useState<Problem[]>([])

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true)
      const { problems: data, total } = await problemService.getProblems({
        ...filters,
        limit: 200,
      })
      const processedData = data.map((problem: Problem) => ({
        ...problem,
        examples: Array.isArray(problem.examples) ? problem.examples : []
      }))
      setProblems(processedData)
      setTotalCount(total)

      if (!filters.category && !filters.difficulty && !filters.search) {
        setAllProblems(processedData)
      }
    } catch (error) {
      message.error('获取题目列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [filters.category, filters.difficulty, filters.search])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      // 如果再次点击已选中的标签，则取消选中
      setSelectedCategory('')
      setFilters({ ...filters, category: '' })
    } else {
      setSelectedCategory(categoryId)
      setFilters({ ...filters, category: categoryId })
    }
  }

  const handleDifficultyChange = (value: string) => {
    setFilters({ ...filters, difficulty: value })
  }

  const formatProblemId = (no: number) => `P${String(no).padStart(4, '0')}`

  const columns = [
    {
      title: 'ID',
      dataIndex: 'problem_no',
      key: 'id',
      width: 80,
      render: (no: number) => formatProblemId(no),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Problem) => (
        <a onClick={() => navigate(`/problems/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: string) => {
        const colors: any = {
          easy: 'green',
          medium: 'blue',
          hard: 'red',
        }
        const labels: any = { easy: '简单', medium: '中等', hard: '困难' }
        return <Tag color={colors[difficulty]}>{labels[difficulty] || difficulty}</Tag>
      },
    },
    {
      title: '分类',
      dataIndex: 'categories',
      key: 'categories',
      width: 150,
      render: (categories: string[]) => {
        if (!categories || categories.length === 0) {
          return <Tag color="default">未分类</Tag>
        }
        return (
          <Space size={4}>
            {categories.slice(0, 2).map((cat) => {
              const category = PROBLEM_CATEGORIES.find(c => c.id === cat)
              return (
                <Tag key={cat} color={category?.section === 'syntax' ? 'cyan' : 'purple'}>
                  {category?.name || cat}
                </Tag>
              )
            })}
            {categories.length > 2 && <Tag>+{categories.length - 2}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '时间限制',
      dataIndex: 'time_limit',
      key: 'time_limit',
      width: 100,
      render: (time: number) => `${time}ms`,
    },
    {
      title: '内存限制',
      dataIndex: 'memory_limit',
      key: 'memory_limit',
      width: 100,
      render: (memory: number) => `${memory}MB`,
    },
  ]

  const categoriesBySection = PROBLEM_CATEGORIES.reduce((acc, category) => {
    if (!acc[category.section]) {
      acc[category.section] = []
    }
    acc[category.section].push(category)
    return acc
  }, {} as Record<string, ProblemCategory[]>)

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>题目列表</Title>
        {(user.role === 'admin' || user.role === 'teacher') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/problems/create')}
          >
            添加题目
          </Button>
        )}
      </div>

      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索题目"
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="选择难度"
            value={filters.difficulty || undefined}
            onChange={handleDifficultyChange}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
        </Space>
      </Card>

      {/* 分类标签区域 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <Space size="middle" wrap>
            <AppstoreOutlined />
            <Text strong>快速筛选：</Text>
            <Button
              type={selectedCategory === '' ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setSelectedCategory('')
                setFilters({ ...filters, category: '' })
              }}
            >
              全部题目 ({totalCount})
            </Button>
          </Space>
        </div>

        {/* 语法基础版块 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <Title level={5} style={{ color: '#1890ff', margin: 0 }}>
              🔤 语法基础
            </Title>
          </div>
          <Space size="small" wrap>
            {categoriesBySection['syntax']?.map((category) => {
              const count = allProblems.filter(p =>
                p.categories?.includes(category.id)
              ).length
              return (
                <Tooltip
                  key={category.id}
                  title={<CategoryTooltip category={category} problemCount={count} />}
                  placement="bottom"
                  color="white"
                >
                  <Tag
                    color={selectedCategory === category.id ? 'cyan' : 'default'}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.name} <span style={{ marginLeft: 4, opacity: 0.6 }}>({count})</span>
                  </Tag>
                </Tooltip>
              )
            })}
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 算法基础（入门级）版块 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <Title level={5} style={{ color: '#722ed1', margin: 0 }}>
              算法基础（入门级）
            </Title>
          </div>
          <Space size="small" wrap>
            {categoriesBySection['algorithm']?.map((category) => {
              const count = allProblems.filter(p =>
                p.categories?.includes(category.id)
              ).length
              return (
                <Tooltip
                  key={category.id}
                  title={<CategoryTooltip category={category} problemCount={count} />}
                  placement="bottom"
                  color="white"
                >
                  <Tag
                    color={selectedCategory === category.id ? 'purple' : 'default'}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.name} <span style={{ marginLeft: 4, opacity: 0.6 }}>({count})</span>
                  </Tag>
                </Tooltip>
              )
            })}
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {/* 算法提高（提高级）版块 */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <Title level={5} style={{ color: '#cf1322', margin: 0 }}>
              算法提高（提高级）
            </Title>
          </div>
          <Space size="small" wrap>
            {categoriesBySection['algorithm_advanced']?.map((category) => {
              const count = allProblems.filter(p =>
                p.categories?.includes(category.id)
              ).length
              return (
                <Tooltip
                  key={category.id}
                  title={<CategoryTooltip category={category} problemCount={count} />}
                  placement="bottom"
                  color="white"
                >
                  <Tag
                    color={selectedCategory === category.id ? 'red' : 'default'}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.name} <span style={{ marginLeft: 4, opacity: 0.6 }}>({count})</span>
                  </Tag>
                </Tooltip>
              )
            })}
          </Space>
        </div>
      </Card>

      {/* 当前筛选状态提示 */}
      {selectedCategory && (
        <Card style={{ marginBottom: 16, backgroundColor: '#f0f7ff' }}>
          <Space>
            <Text>当前筛选：</Text>
            <Tag color="cyan" closable onClose={() => handleCategoryClick('')}>
              {PROBLEM_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </Tag>
            <Text type="secondary">
              共 {problems.filter(p => p.categories?.includes(selectedCategory)).length} 道题目
            </Text>
            <Button type="link" size="small" onClick={() => handleCategoryClick('')}>
              清除筛选
            </Button>
          </Space>
        </Card>
      )}

      {/* 题目列表 */}
      <Card>
        <Table
          columns={columns}
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