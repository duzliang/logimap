import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NodeApprovalActions } from './NodeApprovalActions'
import { withQueryClient } from '@/test/utils'
import type { LogicNode } from '@/types/logic-node.types'
import type { TeamRole } from '@logimap/types'

vi.mock('@/api/approval.api', () => ({
  performApprovalAction: vi.fn(() => Promise.resolve({ id: 'n1', name: 'Node', status: 'REVIEW' }))
}))

function renderComponent(node: Partial<LogicNode>, userRole: TeamRole) {
  const defaultNode: LogicNode = {
    id: 'n1',
    name: 'Test Node',
    status: 'DRAFT',
    priority: 'NORMAL',
    tags: [],
    positionX: 0,
    positionY: 0,
    moduleId: 'm1',
    createdAt: '',
    updatedAt: '',
    ...node
  }

  return render(withQueryClient(
    <NodeApprovalActions node={defaultNode} userRole={userRole} size="sm" />
  ))
}

describe('NodeApprovalActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders submit button for DRAFT node when user is MEMBER', () => {
    renderComponent({ status: 'DRAFT' }, 'MEMBER')
    expect(screen.getByText('提交评审')).toBeInTheDocument()
  })

  it('does not render submit button for VIEWER', () => {
    renderComponent({ status: 'DRAFT' }, 'VIEWER')
    expect(screen.queryByText('提交评审')).not.toBeInTheDocument()
  })

  it('renders approve/reject buttons for REVIEW node when user is ADMIN', () => {
    renderComponent({ status: 'REVIEW' }, 'ADMIN')
    expect(screen.getByText('通过')).toBeInTheDocument()
    expect(screen.getByText('退回修改')).toBeInTheDocument()
  })

  it('does not render approve button for MEMBER on REVIEW node', () => {
    renderComponent({ status: 'REVIEW' }, 'MEMBER')
    expect(screen.queryByText('通过')).not.toBeInTheDocument()
    expect(screen.queryByText('退回修改')).not.toBeInTheDocument()
  })

  it('renders revoke/deprecate buttons for APPROVED node when user is OWNER', () => {
    renderComponent({ status: 'APPROVED' }, 'OWNER')
    expect(screen.getByText('撤销确认')).toBeInTheDocument()
    expect(screen.getByText('废弃')).toBeInTheDocument()
  })

  it('opens confirmation dialog when clicking submit', async () => {
    renderComponent({ status: 'DRAFT' }, 'MEMBER')
    fireEvent.click(screen.getByText('提交评审'))
    await waitFor(() => {
      expect(screen.getByText('提交评审 · Test Node')).toBeInTheDocument()
    })
  })

  it('returns null when no actions are available', () => {
    const { container } = renderComponent({ status: 'DEPRECATED' }, 'ADMIN')
    expect(container.firstChild).toBeNull()
  })
})
