import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, CardContent } from '@logimap/ui'
import { toast } from 'sonner'
import { Link2, Search, Loader2, FileCode } from 'lucide-react'
import { fetchCodeLinks } from '@/api/codeLinks.api'
import { useAuthStore } from '@/stores/auth.store'
import { useTranslation } from '@/i18n'
import { nodeStatusLabel } from '@/lib/i18n-labels'
import type { CodeLinkResult } from '@logimap/types'

export function CodeLinksPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentTeamId } = useAuthStore()
  const [path, setPath] = useState('')
  const [line, setLine] = useState('')
  const [result, setResult] = useState<CodeLinkResult | null>(null)

  const lookupMutation = useMutation({
    mutationFn: () =>
      fetchCodeLinks({
        teamId: currentTeamId!,
        path: path.trim(),
        line: line ? Number(line) : undefined
      }),
    onSuccess: (data) => setResult(data),
    onError: (error) => toast.error(error instanceof Error ? error.message : t('codeLinks.lookupFailed'))
  })

  const handleLookup = () => {
    if (!currentTeamId) {
      toast.error(t('codeLinks.selectTeamFirst'))
      return
    }
    if (!path.trim()) {
      toast.error(t('codeLinks.enterPath'))
      return
    }
    lookupMutation.mutate()
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            {t('codeLinks.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t('codeLinks.subtitle')}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="flex-1"
                placeholder={t('codeLinks.pathPlaceholder')}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <Input
                className="sm:w-28"
                type="number"
                min={1}
                placeholder={t('codeLinks.linePlaceholder')}
                value={line}
                onChange={(e) => setLine(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <Button onClick={handleLookup} disabled={lookupMutation.isPending}>
                {lookupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {t('codeLinks.lookup')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">
              <code className="text-[var(--color-text-primary)]">{result.path}</code>
              {result.line ? <span> : {result.line}</span> : null} — {t('codeLinks.hitPrefix')}{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">{result.count}</span> {t('codeLinks.hitSuffix')}
            </div>

            {result.count === 0 ? (
              <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                <FileCode className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
                <p className="text-[var(--color-text-secondary)]">{t('codeLinks.noRefs')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.nodes.map((node) => (
                  <Card
                    key={node.nodeId}
                    className="cursor-pointer hover:border-[var(--color-border-strong)] transition-colors"
                    onClick={() => navigate(`/modules/${node.moduleId}/graph?highlightNodeIds=${node.nodeId}`)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--color-text-primary)]">{node.nodeName}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] text-[var(--color-text-tertiary)]">
                              {nodeStatusLabel(t, node.status)}
                            </span>
                            {node.lineMatched && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
                                {t('codeLinks.lineMatched')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">
                            {node.systemName} / {node.moduleName}
                          </div>
                          <code className="text-xs text-[var(--color-text-secondary)] break-all">{node.codeRef}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
