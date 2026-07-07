import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea
} from '@logimap/ui'
import { Sparkles, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { batchGenerate } from '@/api/ai.api'
import type { BatchGenerateResult } from '@logimap/types'

interface BatchGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
}

export function BatchGenerateDialog({ open, onOpenChange, teamId }: BatchGenerateDialogProps) {
  const [requirements, setRequirements] = useState('')
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<BatchGenerateResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!requirements.trim()) {
      toast.error('请输入需求描述')
      return
    }

    setIsLoading(true)
    try {
      const data = await batchGenerate({ teamId, requirements, context })
      setResult(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : '批量生成失败'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    onOpenChange(false)
    setRequirements('')
    setContext('')
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-brand-default)]" />
            AI 批量结构建议
          </DialogTitle>
          <DialogDescription>
            输入需求描述，AI 会建议系统、模块和逻辑节点的层级结构。建议结果仅供参考，不会自动创建。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="requirements">需求描述 *</label>
            <Textarea
              id="requirements"
              placeholder="例如：设计一个 4S 店售后维修系统，包含工单创建、派工、结算、回访等流程。"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="context">额外上下文（可选）</label>
            <Textarea
              id="context"
              placeholder="例如：已有会员系统、库存系统，需与其集成。"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !requirements.trim()}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            生成结构建议
          </Button>

          {result && (
            <div className="border border-[var(--color-border-default)] rounded-lg p-4 bg-[var(--color-bg-elevated)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">建议结构</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? '已复制' : '复制 JSON'}
                </Button>
              </div>

              <div className="space-y-4">
                {result.systems.map((system, sIdx) => (
                  <div key={sIdx} className="space-y-2">
                    <div className="font-medium text-[var(--color-brand-hover)]">{system.name}</div>
                    {system.description && (
                      <p className="text-sm text-[var(--color-text-secondary)]">{system.description}</p>
                    )}
                    <div className="pl-4 space-y-3 border-l-2 border-[var(--color-border-default)]">
                      {system.modules?.map((module, mIdx) => (
                        <div key={mIdx}>
                          <div className="text-sm font-medium">{module.name}</div>
                          {module.description && (
                            <p className="text-xs text-[var(--color-text-secondary)]">{module.description}</p>
                          )}
                          <ul className="mt-1 space-y-1">
                            {module.nodes?.map((node, nIdx) => (
                              <li key={nIdx} className="text-sm text-[var(--color-text-secondary)]">
                                • {node.name}
                                {node.summary && <span className="text-xs text-[var(--color-text-tertiary)] ml-2">{node.summary}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
