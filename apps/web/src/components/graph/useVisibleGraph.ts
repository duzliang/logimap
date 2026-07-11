import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { useStore } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'

const BUFFER = 1.4

function useThrottle<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState(value)
  const last = useRef(Date.now())
  useEffect(() => {
    const now = Date.now()
    if (now - last.current >= limit) {
      last.current = now
      setThrottled(value)
    } else {
      const id = setTimeout(() => {
        last.current = Date.now()
        setThrottled(value)
      }, limit - (now - last.current))
      return () => clearTimeout(id)
    }
  }, [value, limit])
  return throttled
}

export function useVisibleGraph(nodes: Node[], edges: Edge[]) {
  const viewport = useStore((s) => s.transform)
  const throttledViewport = useThrottle(viewport, 100)
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el)
  }, [])

  useEffect(() => {
    if (!containerEl) return
    const update = () => setContainerSize({ width: containerEl.clientWidth, height: containerEl.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerEl)
    return () => ro.disconnect()
  }, [containerEl])

  const bounds = useMemo(() => {
    const [x, y, zoom] = throttledViewport
    const halfW = (containerSize.width / zoom) * (BUFFER / 2)
    const halfH = (containerSize.height / zoom) * (BUFFER / 2)
    const centerX = -x / zoom + containerSize.width / zoom / 2
    const centerY = -y / zoom + containerSize.height / zoom / 2
    return {
      minX: centerX - halfW,
      maxX: centerX + halfW,
      minY: centerY - halfH,
      maxY: centerY + halfH
    }
  }, [throttledViewport, containerSize])

  const visibleNodeIds = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return null
    const set = new Set<string>()
    nodes.forEach((n) => {
      const halfW = (n.width ?? 110) / 2
      const halfH = (n.height ?? 75) / 2
      if (
        n.position.x + halfW >= bounds.minX &&
        n.position.x - halfW <= bounds.maxX &&
        n.position.y + halfH >= bounds.minY &&
        n.position.y - halfH <= bounds.maxY
      ) {
        set.add(n.id)
      }
    })
    return set
  }, [nodes, bounds, containerSize])

  const visibleNodes = useMemo(() => {
    if (!visibleNodeIds) return nodes
    return nodes.filter((n) => visibleNodeIds.has(n.id))
  }, [nodes, visibleNodeIds])

  const visibleEdges = useMemo(() => {
    if (!visibleNodeIds) return edges
    return edges.filter((e) => visibleNodeIds.has(e.source) || visibleNodeIds.has(e.target))
  }, [edges, visibleNodeIds])

  return { visibleNodes, visibleEdges, setContainerRef, nodeCount: nodes.length }
}
