import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@logimap/ui'
import { toast } from 'sonner'
import { KeyRound, Plus, Copy, Check, Trash2, Loader2 } from 'lucide-react'
import { fetchApiTokens, createApiToken, revokeApiToken } from '@/api/tokens.api'
import type { ApiTokenCreated } from '@logimap/types'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function ApiTokensPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [createdToken, setCreatedToken] = useState<ApiTokenCreated | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: fetchApiTokens
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createApiToken({
        name: name.trim(),
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
      }),
    onSuccess: (token) => {
      setCreatedToken(token)
      setName('')
      setExpiresInDays('')
      setIsCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '创建令牌失败')
    }
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiToken(id),
    onSuccess: () => {
      toast.success('令牌已撤销')
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '撤销失败')
    }
  })

  const handleCopy = async () => {
    if (!createdToken) return
    await navigator.clipboard.writeText(createdToken.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <KeyRound className="h-6 w-6" />
              API 令牌
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              用于以编程方式访问 LogiMap API，可在请求头 <code>Authorization: Bearer &lt;token&gt;</code> 中使用。
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建令牌
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-[var(--color-text-secondary)] py-12">加载中...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
            <KeyRound className="h-16 w-16 mx-auto text-[var(--color-text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">暂无 API 令牌</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">创建令牌以从 CI、脚本或第三方工具访问 API</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => {
              const revoked = !!token.revokedAt
              const expired = !!token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()
              return (
                <Card key={token.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--color-text-primary)]">{token.name}</span>
                        <code className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-base)] px-1.5 py-0.5 rounded">
                          {token.prefix}…
                        </code>
                        {revoked && <span className="text-xs text-[var(--color-error-text)]">已撤销</span>}
                        {!revoked && expired && <span className="text-xs text-[var(--color-warning-icon)]">已过期</span>}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        创建 {formatDate(token.createdAt)} · 最近使用 {formatDate(token.lastUsedAt)} · 过期{' '}
                        {token.expiresAt ? formatDate(token.expiresAt) : '永不'}
                      </div>
                    </div>
                    {!revoked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeMutation.mutate(token.id)}
                        disabled={revokeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        撤销
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* 创建令牌对话框 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建 API 令牌</DialogTitle>
            <DialogDescription>令牌明文仅在创建后显示一次，请妥善保存。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="token-name">
                名称
              </label>
              <Input
                id="token-name"
                placeholder="例如：CI 部署"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="token-expiry">
                有效期（天，可选）
              </label>
              <Input
                id="token-expiry"
                type="number"
                min={1}
                placeholder="留空表示永不过期"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 明文展示对话框（一次性） */}
      <Dialog open={!!createdToken} onOpenChange={(v) => !v && setCreatedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[var(--color-success-icon)]" />
              令牌已创建
            </DialogTitle>
            <DialogDescription>请立即复制并保存，关闭后将无法再次查看完整令牌。</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <code className="flex-1 text-sm bg-[var(--color-bg-base)] p-3 rounded-md break-all font-mono">
              {createdToken?.token}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedToken(null)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
