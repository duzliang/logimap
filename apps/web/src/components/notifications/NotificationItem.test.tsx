import '@testing-library/jest-dom'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@logimap/types'

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'NODE_STATUS_CHANGED',
    title: '节点状态变更',
    body: '节点被更新',
    payload: { nodeName: '测试节点' },
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    actor: { id: 'a1', name: 'Actor', email: 'actor@example.com' },
    teamId: null,
    nodeId: 'node1',
    moduleId: 'mod1',
    ...overrides
  }
}

describe('NotificationItem', () => {
  it('renders notification title and body', () => {
    renderWithRouter(<NotificationItem notification={createNotification()} />)
    expect(screen.getByText('节点状态变更')).toBeInTheDocument()
    expect(screen.getByText('节点被更新')).toBeInTheDocument()
  })

  it('shows unread indicator for unread notifications', () => {
    const { container } = renderWithRouter(<NotificationItem notification={createNotification({ isRead: false })} />)
    expect(container.querySelector('.bg-violet-500')).toBeInTheDocument()
  })

  it('calls onMarkRead when clicking an unread notification', () => {
    const onMarkRead = vi.fn()
    renderWithRouter(<NotificationItem notification={createNotification({ isRead: false })} onMarkRead={onMarkRead} />)

    fireEvent.click(screen.getByText('节点状态变更'))
    expect(onMarkRead).toHaveBeenCalledWith('n1')
  })

  it('calls onDelete when clicking delete button', () => {
    const onDelete = vi.fn()
    renderWithRouter(<NotificationItem notification={createNotification()} onDelete={onDelete} />)

    const deleteButton = screen.getByTitle('删除')
    fireEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith('n1')
  })
})
