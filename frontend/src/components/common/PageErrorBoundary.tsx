import React from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('页面错误:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="页面出了点问题"
          subTitle={this.state.error?.message || '发生了未知错误，请重试或返回首页'}
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>
              重试
            </Button>,
            <Button key="home" onClick={() => window.location.href = '/'}>
              返回首页
            </Button>,
          ]}
        />
      )
    }

    return this.props.children
  }
}

export default PageErrorBoundary
