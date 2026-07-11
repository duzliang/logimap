import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n'
import { NotificationsPage } from '../NotificationsPage'

vi.mock('@/api/notifications.api', () => ({
  fetchNotifications: vi.fn(() => Promise.resolve({
    notifications: [{ id: 'n1', title: 'First', body: 'First body', createdAt: new Date().toISOString(), isRead: false, type: 'SYSTEM_BROADCAST' }],
    nextCursor: undefined
  })),
  fetchUnreadCount: vi.fn(() => Promise.resolve({ count: 1 })),
  markNotificationsAsRead: vi.fn(() => Promise.resolve({ markedCount: 1 })),
  markNotificationAsUnread: vi.fn(() => Promise.resolve({ success: true })),
  deleteNotification: vi.fn(() => Promise.resolve({ success: true }))
}))

function renderPage() {
  localStorage.setItem('logimap-lang', 'zh')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider defaultLang="zh">
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe('NotificationsPage infinite scroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders notification and shows no more', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument()
    })
    expect(screen.getByText('没有更多通知了')).toBeInTheDocument()
  })
})
