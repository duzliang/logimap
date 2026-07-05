import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { fetchMe } from '@/api/auth.api'
import { fetchTeams } from '@/api/teams.api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@logimap/ui'
import { Layers, ArrowRight } from 'lucide-react'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, token, setUser, logout, setLoading, currentTeamId, setTeams, setCurrentTeamId } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (user && isAuthenticated) {
        setIsChecking(false)
        return
      }

      if (!token) {
        logout()
        navigate('/login')
        return
      }

      try {
        const userData = await fetchMe()
        setUser(userData)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        toast.warning('无法验证登录状态，请检查网络连接')
      } finally {
        setIsChecking(false)
        setLoading(false)
      }
    }

    initAuth()
  }, [navigate, setUser, logout, setLoading, user, isAuthenticated, token])

  // 加载团队列表并设置默认团队
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teams = await fetchTeams()
        setTeams(teams)
        if (!currentTeamId && teams.length > 0) {
          setCurrentTeamId(teams[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error)
      }
    }

    if (isAuthenticated) {
      loadTeams()
    }
  }, [isAuthenticated, currentTeamId, setTeams, setCurrentTeamId])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">LogiMap</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">欢迎使用 LogiMap</h2>
          <p className="text-[var(--color-text-secondary)]">业务逻辑管理系统 - Phase 1 治理中</p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/systems')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center">
                  <Layers className="h-6 w-6 text-[var(--color-text-inverse)]" />
                </div>
                <div>
                  <CardTitle>系统管理</CardTitle>
                  <CardDescription>管理业务系统和模块</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                <span>创建和管理您的业务系统</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
