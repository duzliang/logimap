import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { ThemeToggle } from '@logimap/ui'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { LogOut, User, Users, Settings, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { roleLabels } from '@/lib/team'

export function Topbar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout, teams, currentTeamId, setCurrentTeamId } = useAuthStore()
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)

  const currentTeam = teams.find((t) => t.id === currentTeamId)

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('已退出登录')
  }

  const handleSwitchTeam = (teamId: string) => {
    setCurrentTeamId(teamId)
    setTeamMenuOpen(false)
    queryClient.clear()
    navigate('/dashboard')
    toast.success('已切换团队')
  }

  return (
    <header className="h-14 border-b border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <a href="/dashboard" className="flex items-center gap-2 text-[var(--color-brand-default)] hover:opacity-80 transition-opacity">
          <div className="h-7 w-7 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--color-text-inverse)]" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-lg">LogiMap</span>
        </a>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />

        {teams.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setTeamMenuOpen((open) => !open)}
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] transition-colors"
            >
              <Users className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <span className="hidden sm:inline max-w-[120px] truncate">{currentTeam?.name || '选择团队'}</span>
              <ChevronDown className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${teamMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {teamMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] shadow-dialog z-50">
                <div className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]">切换团队</div>
                <div className="max-h-64 overflow-auto">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSwitchTeam(team.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-sunken)] transition-colors ${team.id === currentTeamId ? 'text-[var(--color-brand-default)] bg-[var(--color-brand-muted)]' : 'text-[var(--color-text-primary)]'}`}
                    >
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{roleLabels[team.role]}</div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[var(--color-border-default)]">
                  <button
                    type="button"
                    onClick={() => {
                      setTeamMenuOpen(false)
                      navigate('/team/settings')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    团队设置
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {user ? (
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <div className="h-7 w-7 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">{user.name}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-error-icon)] hover:bg-[var(--color-error-bg)] transition-colors"
              aria-label="退出登录"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
    </header>
  )
}
