import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@/i18n'
import { ModuleDetailPage } from '../ModuleDetailPage'

const TEST_NODES = Array.from({ length: 60 }, (_, i) => ({
  id: `n${i}`,
  name: `Card Node ${i}`,
  status: 'DRAFT',
  priority: 'MEDIUM',
  branches: [],
  edgeCases: [],
  updatedAt: new Date().toISOString(),
  codeRef: null,
  tags: [],
  notes: null,
  summary: `Summary for card ${i}`,
  trigger: null,
  dependsOn: null,
  mainFlow: null,
  positionX: 0,
  positionY: 0,
  moduleId: 'm1',
  assigneeId: null,
  createdAt: new Date().toISOString()
}))

vi.mock('@/api/logicNodes.api', () => ({
  fetchLogicNodes: vi.fn(() => Promise.resolve(TEST_NODES)),
  createLogicNode: vi.fn(),
  updateLogicNode: vi.fn(),
  deleteLogicNode: vi.fn()
}))

vi.mock('@/api/systems.api', () => ({
  fetchModule: vi.fn(() => Promise.resolve({ id: 'm1', systemId: 's1', name: 'Test Module', slug: 'test', description: '' })),
  fetchSystem: vi.fn(() => Promise.resolve({ id: 's1', name: 'Test System', slug: 'test', description: '', color: null, repoUrl: '', repoBranch: '', modulesCount: 0 })),
  fetchSystems: vi.fn()
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    currentTeamId: 'team1',
    teams: [{ id: 'team1', name: 'Team', role: 'ADMIN' }]
  }))
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider defaultLang="zh">
        <MemoryRouter initialEntries={['/modules/m1']}>
          <Routes>
            <Route path="/modules/:moduleId" element={<ModuleDetailPage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

describe('ModuleDetailPage card virtualization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders first card but not last card', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 600 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1024 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 9120 })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Card Node 0')).toBeInTheDocument()
    })

    expect(screen.queryByText('Card Node 59')).not.toBeInTheDocument()
  })
})
