import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, CardContent } from '@logimap/ui'
import { toast } from 'sonner'
import { Link2, Search, Loader2, FileCode } from 'lucide-react'
import { fetchCodeLinks } from '@/api/codeLinks.api'
import { useAuthStore } from '@/stores/auth.store'
import type { CodeLinkResult } from '@logimap/types'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  REVIEW: '评审中',
  APPROVED: '已批准',
  DEPRECATED: '已废弃'
}

export function CodeLinksPage() {
  const navigate = useNavigate()
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
    onError: (error) => toast.error(error instanceof Error ? error.message : '查询失败')
  })

  const handleLookup = () => {
    if (!currentTeamId) {
      toast.error('请先选择团队')
      return
    }
    if (!path.trim()) {
      toast.error('请输入文件路径')
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
            代码反向关联
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            输入代码文件路径（可选行号），反查团队内引用了该文件的逻辑节点。
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                className="flex-1"
                placeholder="例如：src/services/settlement.ts"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <Input
                className="sm:w-28"
                type="number"
                min={1}
                placeholder="行号(可选)"
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
                反查
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">
              <code className="text-[var(--color-text-primary)]">{result.path}</code>
              {result.line ? <span> : {result.line}</span> : null} — 命中{' '}
              <span className="font-semibold text-[var(--color-text-primary)]">{result.count}</span> 个节点
            </div>

            {result.count === 0 ? (
              <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                <FileCode className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
                <p className="text-[var(--color-text-secondary)]">没有节点引用该文件</p>
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
                              {STATUS_LABEL[node.status] ?? node.status}
                            </span>
                            {node.lineMatched && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
                                行号命中
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
