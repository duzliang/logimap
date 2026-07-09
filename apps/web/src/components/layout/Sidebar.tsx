import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Boxes, Search, Bell, Users, KeyRound, Link2, UserCog } from 'lucide-react'
import { cn } from '@logimap/ui'
import { useI18n, type TranslationKey } from '@/i18n'

interface NavItem {
  to: string
  labelKey: TranslationKey
  icon: React.ElementType
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/systems', labelKey: 'nav.systems', icon: Boxes },
  { to: '/search', labelKey: 'nav.search', icon: Search },
  { to: '/code-links', labelKey: 'nav.codeLinks', icon: Link2 },
  { to: '/notifications', labelKey: 'nav.notifications', icon: Bell },
]

const settingsItems: NavItem[] = [
  { to: '/team/settings', labelKey: 'nav.teamSettings', icon: Users },
  { to: '/settings/account', labelKey: 'nav.accountSettings', icon: UserCog },
  { to: '/settings/tokens', labelKey: 'nav.apiTokens', icon: KeyRound }
]

function SidebarNavLink({ item }: { item: NavItem }) {
  const location = useLocation()
  const { t } = useI18n()
  const isActive = item.end
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  return (
    <NavLink
      to={item.to}
      className={cn(
        'flex items-center gap-2.5 px-3 h-9 rounded-lg w-full text-sm transition-colors duration-100',
        isActive
          ? 'font-medium text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-900/20'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{t(item.labelKey)}</span>
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-[var(--color-bg-elevated)] border-r border-[var(--color-border-default)]">
      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {navItems.map((item) => (
          <SidebarNavLink key={item.to} item={item} />
        ))}

        <div className="my-3 border-t border-[var(--color-border-default)]" />

        {settingsItems.map((item) => (
          <SidebarNavLink key={item.to} item={item} />
        ))}
      </nav>
    </aside>
  )
}
