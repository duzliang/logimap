import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Boxes, Search, Bell, Users } from 'lucide-react'
import { cn } from '@logimap/ui'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/systems', label: '系统', icon: Boxes },
  { to: '/search', label: '搜索', icon: Search },
  { to: '/notifications', label: '通知', icon: Bell },
]

const teamItem: NavItem = { to: '/team/settings', label: '团队设置', icon: Users }

function SidebarNavLink({ item }: { item: NavItem }) {
  const location = useLocation()
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
      <span>{item.label}</span>
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

        <SidebarNavLink item={teamItem} />
      </nav>
    </aside>
  )
}
