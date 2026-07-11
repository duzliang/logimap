import { lazy } from 'react'
import type { ComponentProps } from 'react'
import { LazyDialogBoundary } from '@/components/lazy/LazyDialogBoundary'

const AgentContextExport = lazy(() =>
  import('../ai/AgentContextExport').then((m) => ({ default: m.AgentContextExport }))
)

export function LazyAgentContextExport(props: ComponentProps<typeof AgentContextExport>) {
  return (
    <LazyDialogBoundary title="Agent 上下文导出" description="生成 .cursorrules 或 AGENTS.md 片段，供 Cursor / Claude Code 读取">
      <AgentContextExport {...props} />
    </LazyDialogBoundary>
  )
}
