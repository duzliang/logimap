import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Input, Button } from '@logimap/ui'
import { Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { search } from '@/api/search.api'
import { fetchSystems, fetchModules } from '@/api/systems.api'
import { fetchMembers } from '@/api/teams.api'
import { SearchFilters, type SearchFilterState } from '@/components/search/SearchFilters'
import { SearchResultItem } from '@/components/search/SearchResultItem'
import { NaturalLanguageQuery } from '@/components/search/NaturalLanguageQuery'
import { useTranslation } from '@/i18n'
import type { SearchResultItem as SearchResultItemType } from '@logimap/types'

const PAGE_SIZE = 20

function serializeArray(value: string[]): string | undefined {
  return value.length > 0 ? value.join(',') : undefined
}

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentTeamId } = useAuthStore()

  const [qInput, setQInput] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    setQInput(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('q') ?? ''
      if (qInput === current) return

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (qInput) next.set('q', qInput)
        else next.delete('q')
        next.delete('offset')
        return next
      }, { replace: true })
    }, 300)

    return () => clearTimeout(timer)
  }, [qInput, searchParams, setSearchParams])

  const filters: SearchFilterState = useMemo(
    () => ({
      systemId: searchParams.get('systemId') ?? '',
      moduleId: searchParams.get('moduleId') ?? '',
      statuses: (searchParams.get('statuses') ?? '').split(',').filter(Boolean),
      priorities: (searchParams.get('priorities') ?? '').split(',').filter(Boolean),
      tags: (searchParams.get('tags') ?? '').split(',').filter(Boolean),
      assigneeId: searchParams.get('assigneeId') ?? ''
    }),
    [searchParams]
  )

  const offset = Number(searchParams.get('offset') ?? 0)
  const q = searchParams.get('q') ?? ''

  const { data: systems = [] } = useQuery({
    queryKey: ['systems', currentTeamId],
    queryFn: () => fetchSystems(currentTeamId!),
    enabled: !!currentTeamId
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', filters.systemId],
    queryFn: () => fetchModules(filters.systemId),
    enabled: !!filters.systemId
  })

  const { data: membersData } = useQuery({
    queryKey: ['teamMembers', currentTeamId],
    queryFn: () => fetchMembers(currentTeamId!),
    enabled: !!currentTeamId
  })

  const { data: result, isLoading } = useQuery({
    queryKey: [
      'search',
      {
        q,
        teamId: currentTeamId,
        ...filters,
        limit: PAGE_SIZE,
        offset
      }
    ],
    queryFn: () =>
      search({
        q,
        teamId: currentTeamId ?? undefined,
        systemId: filters.systemId || undefined,
        moduleId: filters.moduleId || undefined,
        statuses: filters.statuses,
        priorities: filters.priorities,
        tags: filters.tags,
        assigneeId: filters.assigneeId || undefined,
        limit: PAGE_SIZE,
        offset
      }),
    enabled: !!currentTeamId
  })

  const members = membersData?.members ?? []

  const handleFilterChange = (next: SearchFilterState) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)

        const setOrDelete = (key: string, value: string | undefined) => {
          if (value) params.set(key, value)
          else params.delete(key)
        }

        setOrDelete('systemId', next.systemId)
        setOrDelete('moduleId', next.moduleId)
        setOrDelete('statuses', serializeArray(next.statuses))
        setOrDelete('priorities', serializeArray(next.priorities))
        setOrDelete('tags', serializeArray(next.tags))
        setOrDelete('assigneeId', next.assigneeId)
        params.delete('offset')

        return params
      },
      { replace: true }
    )
  }

  const handlePageChange = (delta: number) => {
    const nextOffset = Math.max(0, offset + delta * PAGE_SIZE)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (nextOffset > 0) params.set('offset', String(nextOffset))
        else params.delete('offset')
        return params
      },
      { replace: true }
    )
  }

  const allItems: SearchResultItemType[] = useMemo(() => {
    if (!result) return []
    return [...result.systems.items, ...result.modules.items, ...result.nodes.items]
  }, [result])

  const totalResults = (result?.systems.total ?? 0) + (result?.modules.total ?? 0) + (result?.nodes.total ?? 0)
  const hasNext =
    (result?.systems.total ?? 0) > offset + PAGE_SIZE ||
    (result?.modules.total ?? 0) > offset + PAGE_SIZE ||
    (result?.nodes.total ?? 0) > offset + PAGE_SIZE

  return (
    <div className="min-h-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{t('search.title')}</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder={t('search.placeholder')}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="pl-10 h-11 bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
              <h2 className="font-medium mb-4">{t('search.filters')}</h2>
              <SearchFilters
                filters={filters}
                systems={systems}
                modules={modules}
                members={members}
                onChange={handleFilterChange}
              />
            </div>

            {currentTeamId && (
              <NaturalLanguageQuery
                teamId={currentTeamId}
                onNodeClick={(nodeId, moduleId) =>
                  navigate(`/modules/${moduleId}/graph?highlightNodeIds=${nodeId}`)
                }
              />
            )}
          </aside>

          <div className="lg:col-span-3 space-y-6">
            {isLoading && (
              <div className="text-center py-12 text-[var(--color-text-secondary)]">{t('search.searching')}</div>
            )}

            {!isLoading && allItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                <FileText className="h-12 w-12 text-[var(--color-text-tertiary)] mb-4" />
                <p className="text-[var(--color-text-secondary)]">{t('search.noResults')}</p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{t('search.noResultsHint')}</p>
              </div>
            )}

            {!isLoading && allItems.length > 0 && (
              <>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t('search.totalResults', { count: totalResults })}
                </p>

                <div className="space-y-3">
                  {allItems.map((item) => (
                    <SearchResultItem
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onClick={() => navigate(item.href)}
                      onHighlightInGraph={
                        item.type === 'node' && item.moduleId
                          ? () => navigate(`/modules/${item.moduleId}/graph?highlightNodeIds=${item.id}`)
                          : undefined
                      }
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => handlePageChange(-1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t('search.prevPage')}
                  </Button>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {t('search.pageN', { page: offset / PAGE_SIZE + 1 })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => handlePageChange(1)}
                  >
                    {t('search.nextPage')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
