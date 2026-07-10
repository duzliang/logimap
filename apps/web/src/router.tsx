import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/stores/auth.store'
import { useI18n } from '@/i18n'

// 路由级代码分割（T4-1 懒加载）：每个页面拆分为独立 chunk，
// 首屏只加载当前路由所需代码；重型图谱页（React Flow）单独成块。
// 页面均为命名导出，这里映射为 default 以适配 React.lazy。
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const SystemsPage = lazy(() =>
  import('@/pages/systems/SystemsPage').then((m) => ({ default: m.SystemsPage }))
)
const SystemDetailPage = lazy(() =>
  import('@/pages/systems/SystemDetailPage').then((m) => ({ default: m.SystemDetailPage }))
)
const ModuleDetailPage = lazy(() =>
  import('@/pages/logic/ModuleDetailPage').then((m) => ({ default: m.ModuleDetailPage }))
)
const LogicListPage = lazy(() =>
  import('@/pages/logic/LogicListPage').then((m) => ({ default: m.LogicListPage }))
)
const LogicGraphPage = lazy(() =>
  import('@/components/graph/LogicGraph').then((m) => ({ default: m.LogicGraphPage }))
)
const TeamSettingsPage = lazy(() =>
  import('@/pages/team/TeamSettingsPage').then((m) => ({ default: m.TeamSettingsPage }))
)
const NotificationsPage = lazy(() =>
  import('@/pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
)
const SearchResultsPage = lazy(() =>
  import('@/pages/search/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage }))
)
const ApiTokensPage = lazy(() =>
  import('@/pages/settings/ApiTokensPage').then((m) => ({ default: m.ApiTokensPage }))
)
const AccountSettingsPage = lazy(() =>
  import('@/pages/settings/AccountSettingsPage').then((m) => ({ default: m.AccountSettingsPage }))
)
const CodeLinksPage = lazy(() =>
  import('@/pages/code-links/CodeLinksPage').then((m) => ({ default: m.CodeLinksPage }))
)

// 懒加载 chunk 拉取期间的占位（与全屏加载态一致）
function RouteFallback() {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-brand-default)]" />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
      </div>
    </div>
  )
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

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
      <SuspenseRoute>
        <Outlet />
      </SuspenseRoute>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <SuspenseRoute>
        <LoginPage />
      </SuspenseRoute>
    )
  },
  {
    path: '/register',
    element: (
      <SuspenseRoute>
        <RegisterPage />
      </SuspenseRoute>
    )
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
            path: '/settings/account',
            element: <AccountSettingsPage />
          },
          {
            path: '/notifications',
            element: <NotificationsPage />
          },
          {
            path: '/search',
            element: <SearchResultsPage />
          },
          {
            path: '/code-links',
            element: <CodeLinksPage />
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
