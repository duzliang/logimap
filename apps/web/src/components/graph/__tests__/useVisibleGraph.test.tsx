import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useVisibleGraph } from '../useVisibleGraph'

const viewport = { x: 0, y: 0, zoom: 1 }

vi.mock('@xyflow/react', () => ({
  useStore: vi.fn((selector: (s: { transform: [number, number, number] }) => [number, number, number]) =>
    selector({ transform: [viewport.x, viewport.y, viewport.zoom] })
  ),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

const nodes = [
  { id: 'n1', position: { x: 0, y: 0 }, width: 220, height: 150, data: {} },
  { id: 'n2', position: { x: 300, y: 0 }, width: 220, height: 150, data: {} },
  { id: 'n3', position: { x: 2000, y: 0 }, width: 220, height: 150, data: {} }
]

const edges = [
  { id: 'e1', source: 'n1', target: 'n2', type: 'default' as const },
  { id: 'e2', source: 'n2', target: 'n3', type: 'default' as const }
]

function TestHarness({ nodeList = nodes, edgeList = edges }: { nodeList?: typeof nodes; edgeList?: typeof edges }) {
  const { visibleNodes, visibleEdges, setContainerRef, nodeCount } = useVisibleGraph(nodeList, edgeList)
  return (
    <div>
      <div ref={setContainerRef} data-testid="container" style={{ width: 1000, height: 600 }} />
      <div data-testid="result">{visibleNodes.length}|{visibleEdges.length}|{nodeCount}</div>
    </div>
  )
}

describe('useVisibleGraph', () => {
  let originalClientWidth: PropertyDescriptor | undefined
  let originalClientHeight: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1000 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 })
  })

  afterEach(() => {
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth)
    }
    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
    }
  })

  it('culls nodes outside viewport and keeps adjacent edges', () => {
    render(<TestHarness />)
    expect(screen.getByTestId('result')).toHaveTextContent('2|2|3')
  })

  it('returns all items when container is not measured', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 0 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 0 })
    render(<TestHarness />)
    expect(screen.getByTestId('result')).toHaveTextContent('3|2|3')
  })
})
