import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SystemsPage } from '@/pages/systems/SystemsPage'
import { SystemDetailPage } from '@/pages/systems/SystemDetailPage'
import { ModuleDetailPage } from '@/pages/logic/ModuleDetailPage'
import { LogicListPage } from '@/pages/logic/LogicListPage'
import { LogicGraphPage } from '@/components/graph/LogicGraph'
import { TeamSettingsPage } from '@/pages/team/TeamSettingsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { SearchResultsPage } from '@/pages/search/SearchResultsPage'
import { ApiTokensPage } from '@/pages/settings/ApiTokensPage'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/stores/auth.store'

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, token } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold">LogiMap</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">加载中...</p>
        </div>
      </div>
    )
  }

  // 检查是否有 token
  const hasToken = token
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
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
    element: <AppShell />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />
          },
          {
            path: '/systems',
            element: <SystemsPage />
          },
          {
            path: '/systems/:systemId',
            element: <SystemDetailPage />
          },
          {
            path: '/modules/:moduleId',
            element: <ModuleDetailPage />
          },
          {
            path: '/modules/:moduleId/nodes',
            element: <LogicListPage />
          },
          {
            path: '/modules/:moduleId/graph',
            element: <LogicGraphPage />
          },
          {
            path: '/team/settings',
            element: <TeamSettingsPage />
          },
          {
            path: '/settings/tokens',
            element: <ApiTokensPage />
          },
          {
            path: '/notifications',
            element: <NotificationsPage />
          },
          {
            path: '/search',
            element: <SearchResultsPage />
          }
        ]
      }
    ]
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
