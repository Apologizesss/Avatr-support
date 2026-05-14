import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { Setup } from './pages/Setup'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TablePage } from './pages/TablePage'
import { Layout } from './components/Layout'
import { ToastContainer } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CenteredSpinner } from './components/Spinner'

export default function App() {
  useTheme()
  const { user, loading, configured, setConfigured, signIn, signOut, isAdmin } = useAuth()

  let content
  if (!configured) {
    content = <Setup onDone={() => setConfigured(true)} />
  } else if (loading) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <CenteredSpinner label="กำลังตรวจสอบการเข้าสู่ระบบ..." />
      </div>
    )
  } else if (!user) {
    content = <Login onSignIn={signIn} />
  } else {
    content = (
      <Routes>
        <Route element={<Layout user={user} onSignOut={signOut} isAdmin={isAdmin} />}>
          <Route index element={<Dashboard />} />
          <Route path="/t/:tableId" element={<TablePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    )
  }

  return (
    <ErrorBoundary>
      {content}
      <ToastContainer />
    </ErrorBoundary>
  )
}
