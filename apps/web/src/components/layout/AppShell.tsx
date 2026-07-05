import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <Topbar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
