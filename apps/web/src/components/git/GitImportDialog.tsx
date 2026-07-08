import { useState } from 'react'
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@logimap/ui'
import { GitBranch, Loader2, FolderTree, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { analyzeRepo, applyImport } from '@/api/git-import.api'
import type { AnalyzeRepoResult, SuggestedSystem } from '@logimap/types'

interface GitImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
}

type Step = 'input' | 'review'

export function GitImportDialog({ open, onOpenChange, teamId }: GitImportDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('input')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<AnalyzeRepoResult | null>(null)
  const [systems, setSystems] = useState<SuggestedSystem[]>([])

  const reset = () => {
    setStep('input')
    setRepoUrl('')
    setBranch('')
    setResult(null)
    setSystems([])
  }

  const handleClose = () => {
    if (analyzing || importing) return
    reset()
    onOpenChange(false)
  }

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast.error('请输入仓库地址')
      return
    }
    setAnalyzing(true)
    try {
      const data = await analyzeRepo({ teamId, repoUrl: repoUrl.trim(), branch: branch.trim() || undefined })
      setResult(data)
      setSystems(data.systems)
      setStep('review')
      if (data.systems.length === 0) toast.warning('未识别出可导入的目录结构')
    } catch (error) {
      const message = error instanceof Error ? error.message : '仓库分析失败'
      toast.error(message)
    } finally {
      setAnalyzing(false)
    }
  }

  const removeSystem = (idx: number) => {
    setSystems((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeModule = (sysIdx: number, modIdx: number) => {
    setSystems((prev) =>
      prev.map((s, i) => (i === sysIdx ? { ...s, modules: s.modules.filter((_, j) => j !== modIdx) } : s))
    )
  }

  const updateSystemName = (idx: number, name: string) => {
    setSystems((prev) => prev.map((s, i) => (i === idx ? { ...s, name } : s)))
  }

  const handleImport = async () => {
    if (systems.length === 0) {
      toast.error('请至少保留一个系统')
      return
    }
    setImporting(true)
    try {
      const res = await applyImport({
        teamId,
        repoUrl: repoUrl.trim(),
        branch: result?.branch,
        systems
      })
      const totalModules = res.systems.reduce((sum, s) => sum + s.modulesCreated, 0)
      toast.success(`已导入 ${res.systems.length} 个系统、${totalModules} 个模块`)
      queryClient.invalidateQueries({ queryKey: ['systems'] })
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败'
      toast.error(message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            从 Git 仓库导入
          </DialogTitle>
          <DialogDescription>
            输入公开仓库地址，自动分析目录结构并建议系统 / 模块，确认后导入。
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="repoUrl">
                仓库地址
              </label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="branch">
                分支（可选）
              </label>
              <Input
                id="branch"
                placeholder="默认使用仓库默认分支"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 'review' && result && (
          <div className="py-4 space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              分析了 <span className="font-medium">{result.owner}/{result.repo}</span>（{result.branch} 分支，
              {result.fileCount} 个文件），建议如下结构，可删除不需要的项：
            </p>
            {systems.length === 0 && (
              <p className="text-sm text-[var(--color-text-tertiary)]">没有可导入的系统。</p>
            )}
            <div className="space-y-3">
              {systems.map((sys, sysIdx) => (
                <div
                  key={sysIdx}
                  className="rounded-md border border-[var(--color-border-default)] p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-[var(--color-text-brand)] shrink-0" />
                    <Input
                      value={sys.name}
                      onChange={(e) => updateSystemName(sysIdx, e.target.value)}
                      className="h-8"
                    />
                    <span className="text-xs text-[var(--color-text-tertiary)] font-mono shrink-0">
                      {sys.path || 'root'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removeSystem(sysIdx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {sys.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {sys.modules.map((mod, modIdx) => (
                        <span
                          key={modIdx}
                          className="inline-flex items-center gap-1 text-xs bg-[var(--color-bg-base)] rounded px-2 py-0.5"
                        >
                          {mod.name}
                          <button
                            type="button"
                            onClick={() => removeModule(sysIdx, modIdx)}
                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error-icon)]"
                            aria-label={`移除模块 ${mod.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'review' && (
            <Button variant="outline" onClick={() => setStep('input')} disabled={importing}>
              返回
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={analyzing || importing}>
            取消
          </Button>
          {step === 'input' ? (
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {analyzing ? '分析中...' : '分析仓库'}
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing || systems.length === 0}>
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {importing ? '导入中...' : `导入 ${systems.length} 个系统`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
