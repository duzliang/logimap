import type { NodeDiff } from '@/api/logicNodes.api'

interface VersionDiffViewProps {
  diffs: NodeDiff[]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '（空）'
  if (typeof value === 'string') return value || '（空）'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return JSON.stringify(value, null, 2)
}

function getKindLabel(kind: NodeDiff['kind']): string {
  switch (kind) {
    case 'added':
      return '新增'
    case 'removed':
      return '删除'
    case 'changed':
      return '修改'
    case 'unchanged':
      return '无变化'
  }
}

function getKindClass(kind: NodeDiff['kind']): string {
  switch (kind) {
    case 'added':
      return 'bg-[var(--color-success-bg)] border-[var(--color-success-border)]'
    case 'removed':
      return 'bg-[var(--color-error-bg)] border-[var(--color-error-border)]'
    case 'changed':
      return 'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]'
    case 'unchanged':
      return 'bg-[var(--color-bg-base)] border-[var(--color-border-default)]'
  }
}

export function VersionDiffView({ diffs }: VersionDiffViewProps) {
  const visibleDiffs = diffs.filter((d) => d.kind !== 'unchanged')

  if (visibleDiffs.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        与当前版本没有差异
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleDiffs.map((diff) => (
        <div
          key={diff.field}
          className={`rounded-lg border p-3 ${getKindClass(diff.kind)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-[var(--color-text-primary)]">
              {diff.field}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
              {getKindLabel(diff.kind)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-[var(--color-bg-elevated)] rounded p-2">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">旧值</div>
              <pre className="whitespace-pre-wrap break-words text-[var(--color-text-secondary)] font-mono text-xs">
                {formatValue(diff.oldValue)}
              </pre>
            </div>
            <div className="bg-[var(--color-bg-elevated)] rounded p-2">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">新值</div>
              <pre className="whitespace-pre-wrap break-words text-[var(--color-text-secondary)] font-mono text-xs">
                {formatValue(diff.newValue)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
