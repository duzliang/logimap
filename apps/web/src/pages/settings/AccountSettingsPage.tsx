import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, cn } from '@logimap/ui'
import { toast } from 'sonner'
import { Mail, Loader2, UserCog } from 'lucide-react'
import { fetchMe, updateMe } from '@/api/auth.api'

export function AccountSettingsPage() {
  const queryClient = useQueryClient()

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe
  })

  const mutation = useMutation({
    mutationFn: (emailNotifications: boolean) => updateMe({ emailNotifications }),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user)
      toast.success('已更新邮件通知偏好')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : '更新失败')
  })

  const enabled = me?.emailNotifications ?? true

  return (
    <div className="min-h-full bg-[var(--color-bg-base)]">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            账户设置
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">管理你的个人通知偏好。</p>
        </div>

        {isLoading ? (
          <div className="text-center text-[var(--color-text-secondary)] py-12">加载中...</div>
        ) : (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">邮件通知</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      开启后，站内通知将同时通过邮件发送到 <code>{me?.email}</code>
                      （需管理员在服务端配置邮件服务）。
                    </div>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled}
                  aria-label="邮件通知开关"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(!enabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] disabled:opacity-50',
                    enabled ? 'bg-[var(--color-brand-default)]' : 'bg-[var(--color-border-strong)]'
                  )}
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 mx-auto animate-spin text-white" />
                  ) : (
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
