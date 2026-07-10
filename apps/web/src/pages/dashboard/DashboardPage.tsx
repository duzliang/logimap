import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { fetchMe } from '@/api/auth.api'
import { fetchTeams } from '@/api/teams.api'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@logimap/ui'
import { Layers, ArrowRight } from 'lucide-react'
import { useI18n } from '@/i18n'

export function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
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
        // 会话确已失效（token 无效或对应用户不存在）→ 清理并跳转登录，
        // 而非误报网络异常；其余错误（网络波动等）保留原提示。
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 401 || status === 404) {
          logout()
          navigate('/login')
          return
        }
        toast.warning(t('dashboard.authWarning'))
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
          <p className="text-[var(--color-text-secondary)] mt-2">{t('common.loading')}</p>
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
          <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}</h2>
          <p className="text-[var(--color-text-secondary)]">{t('dashboard.subtitle')}</p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/systems')}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center">
                  <Layers className="h-6 w-6 text-[var(--color-text-inverse)]" />
                </div>
                <div>
                  <CardTitle>{t('dashboard.systemsCardTitle')}</CardTitle>
                  <CardDescription>{t('dashboard.systemsCardDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                <span>{t('dashboard.systemsCardHint')}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
