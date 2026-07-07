import { Card, CardContent, Badge } from '@logimap/ui'
import { Folder, Boxes, FileText, GitBranch } from 'lucide-react'
import type { SearchResultItem as SearchResultItemType } from '@logimap/types'

interface SearchResultItemProps {
  item: SearchResultItemType
  onClick?: () => void
  onHighlightInGraph?: () => void
}

const typeIcons = {
  system: Folder,
  module: Boxes,
  node: FileText
}

const typeLabels: Record<SearchResultItemType['type'], string> = {
  system: '系统',
  module: '模块',
  node: '节点'
}

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  REVIEW: '评审中',
  APPROVED: '已确认',
  DEPRECATED: '已废弃'
}

const priorityLabels: Record<string, string> = {
  HIGH: '高',
  NORMAL: '中',
  LOW: '低'
}

const statusVariants = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  DEPRECATED: 'deprecated'
} as const

export function SearchResultItem({ item, onClick, onHighlightInGraph }: SearchResultItemProps) {
  const Icon = typeIcons[item.type]

  return (
    <Card
      className="cursor-pointer hover:border-[var(--color-brand-default)] transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{typeLabels[item.type]}</Badge>
              <span className="font-medium text-[var(--color-text-primary)]">{item.title}</span>
            </div>
            {item.subtitle && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 truncate">
                {item.subtitle}
              </p>
            )}
            {item.type === 'node' && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {item.status && (
                  <Badge variant={statusVariants[item.status]}>
                    {statusLabels[item.status]}
                  </Badge>
                )}
                {item.priority && (
                  <Badge variant="secondary">{priorityLabels[item.priority]}</Badge>
                )}
                {item.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
                {onHighlightInGraph && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onHighlightInGraph()
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-default)] hover:underline ml-auto"
                  >
                    <GitBranch className="h-3 w-3" />
                    在图谱中高亮
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
