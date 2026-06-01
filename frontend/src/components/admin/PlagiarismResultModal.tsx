import { useState } from 'react'
import { Modal, Table, Tag, Progress, Spin, InputNumber, Alert, Typography } from 'antd'
import { problemService } from '../../services/problem.service'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
  problemId: number
  problemTitle: string
}

const PlagiarismResultModal = ({ open, onClose, problemId, problemTitle }: Props) => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [minSimilarity, setMinSimilarity] = useState(0.5)
  const [checked, setChecked] = useState(false)

  const handleCheck = async () => {
    setLoading(true)
    try {
      const data = await problemService.checkPlagiarism(problemId, minSimilarity)
      setResults(data.results || [])
      setChecked(true)
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const getSimilarityColor = (val: number) => {
    if (val >= 0.8) return '#ff4d4f'
    if (val >= 0.6) return '#faad14'
    return '#52c41a'
  }

  const columns = [
    {
      title: '用户 A',
      dataIndex: ['submission_a', 'username'],
      width: 100,
    },
    {
      title: '用户 B',
      dataIndex: ['submission_b', 'username'],
      width: 100,
    },
    {
      title: '相似度',
      dataIndex: 'similarity',
      width: 200,
      render: (val: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={Math.round(val * 100)}
            size="small"
            strokeColor={getSimilarityColor(val)}
            style={{ width: 120, marginBottom: 0 }}
          />
          <Tag color={getSimilarityColor(val)}>{Math.round(val * 100)}%</Tag>
        </div>
      ),
      sorter: (a: any, b: any) => a.similarity - b.similarity,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '提交 A',
      dataIndex: ['submission_a', 'id'],
      width: 80,
      render: (id: number) => <a href={`/submissions/${id}`} target="_blank" rel="noreferrer">#{id}</a>,
    },
    {
      title: '提交 B',
      dataIndex: ['submission_b', 'id'],
      width: 80,
      render: (id: number) => <a href={`/submissions/${id}`} target="_blank" rel="noreferrer">#{id}</a>,
    },
  ]

  return (
    <Modal
      title={`代码查重 - ${problemTitle}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Text>最低相似度阈值：</Text>
        <InputNumber
          min={0.1}
          max={1.0}
          step={0.1}
          value={minSimilarity}
          onChange={v => setMinSimilarity(v || 0.5)}
          style={{ width: 80 }}
        />
        <Spin spinning={loading}>
          <button
            onClick={handleCheck}
            style={{
              padding: '4px 16px',
              borderRadius: 6,
              border: '1px solid #1890ff',
              background: '#1890ff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            开始查重
          </button>
        </Spin>
      </div>

      {checked && results.length === 0 && (
        <Alert type="success" message="未发现疑似抄袭的代码" style={{ marginBottom: 16 }} />
      )}

      {results.length > 0 && (
        <>
          <Alert
            type="warning"
            message={`发现 ${results.length} 对疑似抄袭代码`}
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(r) => `${r.submission_a.id}-${r.submission_b.id}`}
            size="small"
            pagination={false}
          />
        </>
      )}
    </Modal>
  )
}

export default PlagiarismResultModal
