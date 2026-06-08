import { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Popconfirm, Space, message, Upload, Modal, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined, UploadOutlined, SafetyOutlined, FileExcelOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { problemService } from '../../services/problem.service'
import { PROBLEM_CATEGORIES } from '../../types/problem'
import type { Problem } from '../../types'
import PlagiarismResultModal from '../../components/admin/PlagiarismResultModal'

const { Search } = Input

const difficultyMap: Record<string, { color: string; label: string }> = {
  easy: { color: 'green', label: '简单' },
  medium: { color: 'orange', label: '中等' },
  hard: { color: 'red', label: '困难' },
}

type ProblemTypeTab = 'all' | 'coding' | 'objective'

const AdminProblemList = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [typeTab, setTypeTab] = useState<ProblemTypeTab>('all')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [plagiarismOpen, setPlagiarismOpen] = useState(false)
  const [selectedProblem, setSelectedProblem] = useState<{ id: number; title: string } | null>(null)
  const navigate = useNavigate()

  const loadProblems = async () => {
    setLoading(true)
    try {
      const data = await problemService.getProblems({
        search: search || undefined,
        difficulty: difficulty || undefined,
        problem_type: typeTab === 'all' ? undefined : typeTab,
        page: pagination.current,
        limit: pagination.pageSize,
      })
      setProblems(data.problems || [])
      setPagination(prev => ({ ...prev, total: data.total }))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProblems()
  }, [pagination.current, pagination.pageSize, typeTab])

  const handleDelete = async (id: number) => {
    try {
      await problemService.deleteProblem(id)
      message.success('删除成功')
      loadProblems()
    } catch (error) {
      console.error(error)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await problemService.exportProblems()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.download = `problems_export_${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      console.error(error)
      message.error('导出失败')
    }
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const problems = data.problems || data
      if (!Array.isArray(problems)) {
        message.error('无效的文件格式')
        return
      }
      const result = await problemService.importProblems(problems)
      message.success(`导入完成：成功 ${result.success} 题，失败 ${result.failed} 题`)
      if (result.errors.length > 0) {
        Modal.warning({
          title: '部分题目导入失败',
          content: (
            <ul style={{ maxHeight: 300, overflow: 'auto' }}>
              {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
            </ul>
          ),
        })
      }
      setImportModalOpen(false)
      loadProblems()
    } catch (err: any) {
      message.error(`导入失败: ${err.message || '文件格式错误'}`)
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await problemService.downloadObjectiveTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'objective_template.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      message.error('下载模板失败')
    }
  }

  const handleExcelImport = async (file: File) => {
    setImporting(true)
    try {
      const result = await problemService.importObjectiveExcel(file)
      message.success(`导入完成：成功 ${result.success} 题，失败 ${result.failed} 题`)
      if (result.errors.length > 0) {
        Modal.warning({
          title: '部分题目导入失败',
          content: (
            <ul style={{ maxHeight: 300, overflow: 'auto' }}>
              {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
            </ul>
          ),
        })
      }
      setExcelModalOpen(false)
      loadProblems()
    } catch (err: any) {
      message.error(`导入失败: ${err.message || '文件格式错误'}`)
    } finally {
      setImporting(false)
    }
  }

  const getCategoryName = (catId: string) => {
    const cat = PROBLEM_CATEGORIES.find(c => c.id === catId)
    return cat?.name || catId
  }

  const isObjectiveView = typeTab === 'objective'

  const columns = [
    {
      title: 'ID',
      dataIndex: 'problem_no',
      width: 90,
      sorter: (a: Problem, b: Problem) => (a.problem_no || '').localeCompare(b.problem_no || ''),
      render: (no: string) => no || '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (d: string) => {
        const info = difficultyMap[d]
        return <Tag color={info?.color}>{info?.label || d}</Tag>
      },
    },
    ...(typeTab === 'all'
      ? [{
          title: '类型',
          dataIndex: 'problem_type',
          width: 80,
          render: (t: string) => t === 'objective' ? <Tag color="purple">客观题</Tag> : <Tag color="blue">编程题</Tag>,
        }]
      : isObjectiveView
      ? [{
          title: '题型',
          dataIndex: 'objective_data',
          width: 80,
          render: (od: any) => {
            if (!od) return '-'
            return od.type === 'choice' ? <Tag color="cyan">单选</Tag> : <Tag color="geekblue">判断</Tag>
          },
        }]
      : []
    ),
    {
      title: '分类',
      dataIndex: 'categories',
      width: 200,
      render: (cats: string[] | string) => {
        const list = Array.isArray(cats) ? cats : cats ? [cats] : []
        return (
          <span>
            {list.slice(0, 3).map(c => (
              <Tag key={c} style={{ marginBottom: 2 }}>{getCategoryName(c)}</Tag>
            ))}
          </span>
        )
      },
    },
    ...(!isObjectiveView
      ? [
          {
            title: '时间限制',
            dataIndex: 'time_limit',
            width: 90,
            render: (v: number) => `${v}ms`,
          },
          {
            title: '内存限制',
            dataIndex: 'memory_limit',
            width: 90,
            render: (v: number) => `${v}MB`,
          },
        ]
      : []),
    {
      title: '操作',
      width: isObjectiveView ? 160 : 200,
      render: (_: any, record: Problem) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/problems/${record.id}/edit`)}
          >
            编辑
          </Button>
          {!isObjectiveView && (
            <Button
              type="link"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => {
                setSelectedProblem({ id: record.id, title: record.title })
                setPlagiarismOpen(true)
              }}
            >
              查重
            </Button>
          )}
          <Popconfirm title="确定删除此题目？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0 }}>题目管理</h2>
        <Space wrap>
          {isObjectiveView && (
            <Button icon={<FileExcelOutlined />} onClick={() => setExcelModalOpen(true)}>
              Excel 导入
            </Button>
          )}
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出题目</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>JSON 导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/problems/create')}>
            创建题目
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={typeTab}
        onChange={(key) => {
          setTypeTab(key as ProblemTypeTab)
          setPagination(prev => ({ ...prev, current: 1 }))
        }}
        items={[
          { key: 'all', label: '全部题目' },
          { key: 'coding', label: '编程题' },
          { key: 'objective', label: '客观题' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Search
          placeholder="搜索题目标题"
          allowClear
          onSearch={(v) => { setSearch(v); setPagination(prev => ({ ...prev, current: 1 })) }}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="难度筛选"
          allowClear
          style={{ width: 120 }}
          onChange={(v) => { setDifficulty(v); setPagination(prev => ({ ...prev, current: 1 })) }}
          options={[
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'medium' },
            { label: '困难', value: 'hard' },
          ]}
        />
      </div>

      <Table
        dataSource={problems}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />

      {/* JSON Import Modal */}
      <Modal
        title="导入题目 (JSON)"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImport(file)
              return false
            }}
          >
            <button
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '2px dashed #1890ff',
                background: '#f0f7ff',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              <UploadOutlined style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
              {importing ? '正在导入...' : '点击上传 JSON 文件'}
            </button>
          </Upload>
          <p style={{ marginTop: 12, color: '#999' }}>
            支持 OJ 格式的 JSON 文件，包含 problems 数组
          </p>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal
        title="Excel 批量导入客观题"
        open={excelModalOpen}
        onCancel={() => setExcelModalOpen(false)}
        footer={null}
        width={520}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}>
            1. 下载 Excel 模板，按格式填写客观题数据（支持单选题和判断题）
          </p>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>
        </div>
        <div>
          <p style={{ marginBottom: 8 }}>
            2. 选择填写好的 Excel 文件上传导入
          </p>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleExcelImport(file)
              return false
            }}
          >
            <button
              style={{
                width: '100%',
                padding: '20px 24px',
                borderRadius: 8,
                border: '2px dashed #722ed1',
                background: '#f9f0ff',
                cursor: importing ? 'wait' : 'pointer',
                fontSize: 16,
                color: '#722ed1',
              }}
              disabled={importing}
            >
              <FileExcelOutlined style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              {importing ? '正在导入...' : '点击上传 Excel 文件 (.xlsx)'}
            </button>
          </Upload>
          <p style={{ marginTop: 12, color: '#999', fontSize: 13 }}>
            模板包含示例数据，请删除示例行后填入自己的题目
          </p>
        </div>
      </Modal>

      {/* Plagiarism Modal */}
      {selectedProblem && (
        <PlagiarismResultModal
          open={plagiarismOpen}
          onClose={() => { setPlagiarismOpen(false); setSelectedProblem(null) }}
          problemId={selectedProblem.id}
          problemTitle={selectedProblem.title}
        />
      )}
    </div>
  )
}

export default AdminProblemList
