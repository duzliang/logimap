import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge
} from '@logimap/ui'
import { toast } from 'sonner'
import {
  fetchLogicNodeVersions,
  fetchVersionDiff,
  restoreLogicNodeVersion
} from '@/api/logicNodes.api'
import { VersionDiffView } from './VersionDiffView'
import { History, ArrowLeft, RotateCcw, GitCompare } from 'lucide-react'

interface VersionHistoryDialogProps {
  nodeId: string
  nodeName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore?: () => void
}

export function VersionHistoryDialog({
  nodeId,
  nodeName,
  open,
  onOpenChange,
  onRestore
}: VersionHistoryDialogProps) {
  const queryClient = useQueryClient()
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['logicNodeVersions', nodeId],
    queryFn: () => fetchLogicNodeVersions(nodeId),
    enabled: open
  })

  const {
    data: diffs,
    isLoading: isDiffLoading,
    error: diffError
  } = useQuery({
    queryKey: ['logicNodeVersionDiff', nodeId, selectedVersion],
    queryFn: () => fetchVersionDiff(nodeId, selectedVersion!),
    enabled: selectedVersion !== null
  })

  useEffect(() => {
    if (diffError) {
      toast.error('对比失败')
    }
  }, [diffError])

  const restoreMutation = useMutation({
    mutationFn: ({ version }: { version: number }) => restoreLogicNodeVersion(nodeId, version),
    onSuccess: () => {
      toast.success('版本回滚成功')
      queryClient.invalidateQueries({ queryKey: ['logicNodeVersions', nodeId] })
      queryClient.invalidateQueries({ queryKey: ['logicNode', nodeId] })
      queryClient.invalidateQueries({ queryKey: ['logicNodes'] })
      onRestore?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || '版本回滚失败')
    }
  })

  const handleCompare = (version: number) => {
    setSelectedVersion(version)
  }

  const handleRestore = (version: number) => {
    if (confirm(`确定要回滚到版本 ${version} 吗？当前内容将被保存为新版本。`)) {
      restoreMutation.mutate({ version })
    }
  }

  const handleBack = () => {
    setSelectedVersion(null)
  }

  const title = selectedVersion
    ? `版本 ${selectedVersion} · ${nodeName}`
    : `版本历史 · ${nodeName}`

  const description = selectedVersion
    ? `对比版本 ${selectedVersion} 与当前版本`
    : '查看节点历史变更并回滚到指定版本'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedVersion && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {!selectedVersion && <History className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-[var(--color-text-secondary)]">加载版本历史...</div>
        ) : selectedVersion ? (
          <div className="mt-4">
            {isDiffLoading ? (
              <div className="py-12 text-center text-[var(--color-text-secondary)]">生成差异...</div>
            ) : diffs ? (
              <VersionDiffView diffs={diffs} />
            ) : null}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-secondary)]">暂无历史版本</div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">V{version.version}</Badge>
                    <div className="text-sm">
                      <div className="text-[var(--color-text-primary)]">
                        {version.changeNote || '自动保存的版本快照'}
                      </div>
                      <div className="text-[var(--color-text-secondary)] text-xs">
                        {format(new Date(version.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        {version.createdBy && ` · ${version.createdBy.name}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompare(version.version)}
                    >
                      <GitCompare className="h-4 w-4 mr-1" />
                      对比
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(version.version)}
                      disabled={restoreMutation.isPending}
                      className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      回滚
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
