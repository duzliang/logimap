import { useState } from 'react'
import { Input, Badge } from '@logimap/ui'
import { X } from 'lucide-react'
import type { TeamMember } from '@/types/team.types'
import type { System, Module } from '@/types/system.types'

export interface SearchFilterState {
  systemId: string
  moduleId: string
  statuses: string[]
  priorities: string[]
  tags: string[]
  assigneeId: string
}

interface SearchFiltersProps {
  filters: SearchFilterState
  systems: System[]
  modules: Module[]
  members: TeamMember[]
  onChange: (filters: SearchFilterState) => void
}

const statuses = ['DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED'] as const
const priorities = ['HIGH', 'NORMAL', 'LOW'] as const

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

export function SearchFilters({ filters, systems, modules, members, onChange }: SearchFiltersProps) {
  const [tagInput, setTagInput] = useState('')

  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses: next })
  }

  const togglePriority = (priority: string) => {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority]
    onChange({ ...filters, priorities: next })
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag || filters.tags.includes(tag)) return
    onChange({ ...filters, tags: [...filters.tags, tag] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    onChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          系统
        </label>
        <select
          value={filters.systemId}
          onChange={(e) => onChange({ ...filters, systemId: e.target.value, moduleId: '' })}
          className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-default)]"
        >
          <option value="">全部系统</option>
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          模块
        </label>
        <select
          value={filters.moduleId}
          onChange={(e) => onChange({ ...filters, moduleId: e.target.value })}
          disabled={!filters.systemId}
          className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-default)] disabled:opacity-50"
        >
          <option value="">全部模块</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          状态
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className="focus:outline-none"
            >
              <Badge
                variant={filters.statuses.includes(status) ? statusVariants[status] : 'outline'}
                className="cursor-pointer"
              >
                {statusLabels[status]}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          优先级
        </label>
        <div className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => togglePriority(priority)}
              className="focus:outline-none"
            >
              <Badge
                variant={filters.priorities.includes(priority) ? 'secondary' : 'outline'}
                className="cursor-pointer"
              >
                {priorityLabels[priority]}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          标签
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="输入标签后按回车"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            className="bg-[var(--color-bg-base)]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-[var(--color-error-icon)]"
                aria-label={`移除标签 ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-text-primary)] mb-2 block">
          创建人
        </label>
        <select
          value={filters.assigneeId}
          onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
          className="w-full h-9 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-default)]"
        >
          <option value="">全部</option>
          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name || member.user.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
