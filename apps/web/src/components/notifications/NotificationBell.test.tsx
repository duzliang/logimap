import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'
import { withQueryClient } from '@/test/utils'

function renderWithRouter(ui: React.ReactNode) {
  return render(
    <MemoryRouter>{ui}</MemoryRouter>
  )
}

vi.mock('@/api/notifications.api', () => ({
  fetchNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve({ count: 0 })),
  markNotificationsAsRead: vi.fn(() => Promise.resolve({ markedCount: 1 })),
  markNotificationAsUnread: vi.fn(() => Promise.resolve({ success: true })),
  deleteNotification: vi.fn(() => Promise.resolve({ success: true }))
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bell button', async () => {
    renderWithRouter(withQueryClient(<NotificationBell />))
    await waitFor(() => {
      expect(screen.getByLabelText('通知')).toBeInTheDocument()
    })
  })

  it('opens dropdown when clicked', async () => {
    renderWithRouter(withQueryClient(<NotificationBell />))
    await waitFor(() => {
      expect(screen.getByLabelText('通知')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('通知'))
    expect(screen.getByText('通知')).toBeInTheDocument()
  })
})
