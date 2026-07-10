import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { fetchMe } from '@/api/auth.api'
import { fetchTeams } from '@/api/teams.api'
import { fetchDashboardSummary } from '@/api/dashboard.api'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton
} from '@logimap/ui'
import { Boxes, Search, Link2, Bell, ArrowRight, Layers, Component, FileText, ClipboardCheck, Activity } from 'lucide-react'
import { useI18n } from '@/i18n'
import { nodeStatusLabel, priorityLabel } from '@/lib/i18n-labels'
import type { DashboardNodeItem, DashboardStatusCounts, DashboardSummary } from '@logimap/types'

// ── 状态 → Badge variant / 分布条配色（沿用「砚」四态语义色）──
const STATUS_BADGE: Record<string, 'draft' | 'review' | 'approved' | 'deprecated'> = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  DEPRECATED: 'deprecated'
}
const STATUS_ORDER: (keyof DashboardStatusCounts)[] = ['APPROVED', 'REVIEW', 'DRAFT', 'DEPRECATED']
const STATUS_BAR_COLOR: Record<keyof DashboardStatusCounts, string> = {
  APPROVED: 'bg-emerald-400 dark:bg-emerald-500',
  REVIEW: 'bg-amber-400 dark:bg-amber-500',
  DRAFT: 'bg-neutral-300 dark:bg-neutral-600',
  DEPRECATED: 'bg-rose-400 dark:bg-rose-500'
}

function useRelativeTime() {
  const { lang, t } = useI18n()
  return useMemo(() => {
    const rtf = new Intl.RelativeTimeFormat(lang === 'zh' ? 'zh-CN' : 'en', { numeric: 'auto' })
    return (iso: string): string => {
      const diffMs = new Date(iso).getTime() - Date.now()
      const diffSec = Math.round(diffMs / 1000)
      const abs = Math.abs(diffSec)
      if (abs < 60) return t('dashboard.justNow')
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31536000],
        ['month', 2592000],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60]
      ]
      for (const [unit, secs] of units) {
        if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit)
      }
      return t('dashboard.justNow')
    }
  }, [lang, t])
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-text-brand)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold tabular-nums leading-tight text-[var(--color-text-primary)]">{value}</div>
        <div className="truncate text-xs text-[var(--color-text-secondary)]">{label}</div>
      </div>
    </div>
  )
}

function StatusDistribution({ counts }: { counts: DashboardStatusCounts }) {
  const { t } = useI18n()
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.statusTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">{t('dashboard.statusEmpty')}</p>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-sunken)]">
              {STATUS_ORDER.map((s) =>
                counts[s] > 0 ? (
                  <div
                    key={s}
                    className={STATUS_BAR_COLOR[s]}
                    style={{ width: `${(counts[s] / total) * 100}%` }}
                    title={`${nodeStatusLabel(t, s)}: ${counts[s]}`}
                  />
                ) : null
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <span className={`h-2 w-2 rounded-full ${STATUS_BAR_COLOR[s]}`} />
                  <span>{nodeStatusLabel(t, s)}</span>
                  <span className="tabular-nums text-[var(--color-text-tertiary)]">{counts[s]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function NodeRow({ node }: { node: DashboardNodeItem }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const relative = useRelativeTime()

  return (
    <button
      type="button"
      onClick={() => navigate(`/modules/${node.moduleId}/graph?highlightNodeIds=${node.id}`)}
      className="group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--color-bg-sunken)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">{node.name}</span>
          <Badge variant={STATUS_BADGE[node.status] ?? 'draft'}>{nodeStatusLabel(t, node.status)}</Badge>
        </div>
        <div className="mt-0.5 truncate text-xs text-[var(--color-text-tertiary)]">
          {t('dashboard.inSystemModule', { system: node.systemName, module: node.moduleName })}
          {' · '}
          {node.updatedByName
            ? t('dashboard.updatedBy', { name: node.updatedByName })
            : t('dashboard.updatedByUnknown')}
          {' · '}
          {relative(node.updatedAt)}
        </div>
      </div>
      <span className="mt-0.5 shrink-0 text-[10px] text-[var(--color-text-tertiary)]">{priorityLabel(t, node.priority)}</span>
      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

function NodeListCard({
  title,
  subtitle,
  icon: Icon,
  nodes,
  emptyMessage
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  nodes: DashboardNodeItem[]
  emptyMessage: string
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {nodes.length === 0 ? (
          <EmptyState className="py-8" message={emptyMessage} />
        ) : (
          <div className="-mx-2 space-y-0.5">
            {nodes.map((node) => (
              <NodeRow key={node.id} node={node} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickLink({
  icon: Icon,
  title,
  desc,
  to
}: {
  icon: React.ElementType
  title: string
  desc: string
  to: string
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] px-4 py-3 text-left transition-all hover:border-[var(--color-border-strong)] hover:shadow-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-brand)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">{title}</div>
        <div className="truncate text-xs text-[var(--color-text-secondary)]">{desc}</div>
      </div>
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, isAuthenticated, token, setUser, logout, setLoading, currentTeamId, setTeams, setCurrentTeamId } =
    useAuthStore()
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

  const {
    data: summary,
    isLoading,
    isError,
    refetch
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', currentTeamId],
    queryFn: () => fetchDashboardSummary(currentTeamId ?? undefined),
    enabled: isAuthenticated && !isChecking
  })

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
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t('dashboard.welcome')}
            {user.name ? `，${user.name}` : ''}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{t('dashboard.subtitle')}</p>
        </header>

        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <EmptyState
            className="py-16"
            message={t('dashboard.loadError')}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                {t('dashboard.retry')}
              </Button>
            }
          />
        ) : summary ? (
          <div className="space-y-6">
            {/* 统计卡 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Layers} label={t('dashboard.statSystems')} value={summary.counts.systems} />
              <StatCard icon={Component} label={t('dashboard.statModules')} value={summary.counts.modules} />
              <StatCard icon={FileText} label={t('dashboard.statNodes')} value={summary.counts.nodes} />
              <StatCard icon={Bell} label={t('dashboard.statUnread')} value={summary.unreadNotifications} />
            </div>

            {/* 状态分布 */}
            <StatusDistribution counts={summary.nodesByStatus} />

            {/* 待评审 + 最近更新 */}
            <div className="grid gap-4 lg:grid-cols-2">
              <NodeListCard
                title={t('dashboard.reviewTitle')}
                subtitle={t('dashboard.reviewSubtitle')}
                icon={ClipboardCheck}
                nodes={summary.reviewQueue}
                emptyMessage={t('dashboard.reviewEmpty')}
              />
              <NodeListCard
                title={t('dashboard.recentTitle')}
                subtitle={t('dashboard.recentSubtitle')}
                icon={Activity}
                nodes={summary.recentNodes}
                emptyMessage={t('dashboard.recentEmpty')}
              />
            </div>

            {/* 快捷入口 */}
            <section>
              <h3 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">{t('dashboard.quickTitle')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink icon={Boxes} title={t('dashboard.quickSystems')} desc={t('dashboard.quickSystemsDesc')} to="/systems" />
                <QuickLink icon={Search} title={t('dashboard.quickSearch')} desc={t('dashboard.quickSearchDesc')} to="/search" />
                <QuickLink icon={Link2} title={t('dashboard.quickCodeLinks')} desc={t('dashboard.quickCodeLinksDesc')} to="/code-links" />
                <QuickLink icon={Bell} title={t('dashboard.quickNotifications')} desc={t('dashboard.quickNotificationsDesc')} to="/notifications" />
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  )
}
