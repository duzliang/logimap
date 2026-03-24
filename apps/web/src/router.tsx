import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SystemsPage } from '@/pages/systems/SystemsPage'
import { SystemDetailPage } from '@/pages/systems/SystemDetailPage'
import { ModuleDetailPage } from '@/pages/logic/ModuleDetailPage'
import { LogicListPage } from '@/pages/logic/LogicListPage'
import { LogicGraphPage } from '@/components/graph/LogicGraph'
import { useAuthStore } from '@/stores/auth.store'

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, token } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">LogiMap</h1>
          <p className="text-gray-500 mt-2">加载中...</p>
        </div>
      </div>
    )
  }

  // 检查是否有 token（可能来自 localStorage 或 zustand persist）
  const hasToken = token || localStorage.getItem('token')
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/systems',
    element: (
      <ProtectedRoute>
        <SystemsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/systems/:systemId',
    element: (
      <ProtectedRoute>
        <SystemDetailPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/modules/:moduleId',
    element: (
      <ProtectedRoute>
        <ModuleDetailPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/modules/:moduleId/nodes',
    element: (
      <ProtectedRoute>
        <LogicListPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/modules/:moduleId/graph',
    element: (
      <ProtectedRoute>
        <LogicGraphPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
])
