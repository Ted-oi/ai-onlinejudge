import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, Result, Button } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App.tsx'
import './styles/index.css'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('应用错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ConfigProvider locale={zhCN}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
            <Result
              status="500"
              title="应用出现了错误"
              subTitle="请尝试刷新页面，如果问题持续出现请联系管理员"
              extra={
                <Button type="primary" onClick={() => window.location.reload()}>
                  刷新页面
                </Button>
              }
            />
          </div>
        </ConfigProvider>
      )
    }

    return this.props.children
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
