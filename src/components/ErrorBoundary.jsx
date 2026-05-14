import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full card p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาดในระบบ</h1>
          <p className="text-brand-600 dark:text-brand-400 text-sm mb-6">
            ระบบเจอปัญหาที่คาดไม่ถึง ลองกลับไปหน้าเดิมหรือโหลดหน้าใหม่ดูครับ
          </p>

          {this.state.error && (
            <details className="text-left mb-6 text-xs">
              <summary className="cursor-pointer text-brand-500 hover:text-brand-700 dark:hover:text-brand-300">
                รายละเอียดสำหรับทีมเทคนิค
              </summary>
              <pre className="mt-2 p-3 bg-brand-100 dark:bg-brand-950 rounded-lg overflow-auto max-h-40 text-[10px] font-mono">
                {this.state.error.toString()}
                {this.state.error.stack && '\n\n' + this.state.error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary" onClick={this.handleReset}>
              ลองอีกครั้ง
            </button>
            <button className="btn btn-primary" onClick={this.handleReload}>
              <RefreshCw className="w-4 h-4" />
              โหลดหน้าใหม่
            </button>
          </div>
        </div>
      </div>
    )
  }
}
