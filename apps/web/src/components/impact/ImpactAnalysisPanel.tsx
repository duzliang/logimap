import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { analyzeImpact, createReport } from '@/api/impact.api'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@logimap/ui'
import { Download, Sparkles, AlertTriangle, GitBranch, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { ImpactScope, ImpactDirection } from '@logimap/types'

interface ImpactAnalysisPanelProps {
  nodeId: string
  moduleId: string
  nodeName: string
}

type Layer = 'direct' | 'indirect' | 'third'

const directionOptions: { value: ImpactDirection; label: string }[] = [
  { value: 'downstream', label: '下游影响' },
  { value: 'upstream', label: '上游依赖' },
  { value: 'both', label: '上下游' }
]

const layerOptions: { value: Layer; label: string }[] = [
  { value: 'direct', label: '直接' },
  { value: 'indirect', label: '间接' },
  { value: 'third', label: '第三层' }
]

export function ImpactAnalysisPanel({ nodeId, moduleId, nodeName }: ImpactAnalysisPanelProps) {
  const [direction, setDirection] = useState<ImpactDirection>('downstream')
  const [layer, setLayer] = useState<Layer>('direct')
  const [scope, setScope] = useState<ImpactScope | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeImpact({ nodeId, direction, maxDepth: 3 }),
    onSuccess: (data) => {
      setScope(data)
    },
    onError: (error: Error) => {
      toast.error(error.message || '影响分析失败')
    }
  })

  const reportMutation = useMutation({
    mutationFn: () =>
      createReport({
        nodeId,
        moduleId,
        title: `${nodeName} 变更影响报告`,
        direction,
        maxDepth: 3
      }),
    onSuccess: () => {
      toast.success('报告已保存')
    },
    onError: () => {
      toast.error('报告保存失败')
    }
  })

  const downloadMarkdown = () => {
    if (!scope) return
    const lines: string[] = [
      `# 变更影响报告：${nodeName}`,
      '',
      `- 分析方向：${directionOptions.find((d) => d.value === scope.direction)?.label}`,
      `- 最大深度：${scope.maxDepth} 层`,
      '',
      '## 影响概览',
      '',
      `| 层级 | 节点数量 |`,
      `|------|----------|`,
      `| 直接影响 | ${scope.direct.length} |`,
      `| 间接影响 | ${scope.indirect.length} |`,
      `| 第三层影响 | ${scope.thirdLevel.length} |`,
      '',
      '## 受影响节点',
      '',
      ...[...scope.direct, ...scope.indirect, ...scope.thirdLevel].map(
        (n) => `- ${n.name}（${n.status}，第 ${n.depth} 层）`
      ),
      ''
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `impact-report-${nodeName}-${new Date().toISOString().split('T')[0]}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const currentNodes = scope
    ? layer === 'direct'
      ? scope.direct
      : layer === 'indirect'
        ? scope.indirect
        : scope.thirdLevel
    : []

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-[var(--color-border-default)] p-1 bg-[var(--color-bg-elevated)]">
        {directionOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDirection(option.value)}
            className={`flex-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
              direction === option.value
                ? 'bg-[var(--color-brand-default)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} className="w-full">
        {analyzeMutation.isPending ? (
          '分析中...'
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            开始分析
          </>
        )}
      </Button>

      {scope && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">影响概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[var(--color-bg-sunken)] rounded-lg">
                  <div className="text-lg font-semibold">{scope.direct.length}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">直接影响</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-sunken)] rounded-lg">
                  <div className="text-lg font-semibold">{scope.indirect.length}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">间接影响</div>
                </div>
                <div className="p-2 bg-[var(--color-bg-sunken)] rounded-lg">
                  <div className="text-lg font-semibold">{scope.thirdLevel.length}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">第三层</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex rounded-lg border border-[var(--color-border-default)] p-1 bg-[var(--color-bg-elevated)]">
            {layerOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLayer(option.value)}
                className={`flex-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
                  layer === option.value
                    ? 'bg-[var(--color-brand-default)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <ImpactNodeList nodes={currentNodes} />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={downloadMarkdown}>
              <Download className="w-4 h-4 mr-2" />
              下载 Markdown
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
            >
              保存报告
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ImpactNodeList({ nodes }: { nodes: ImpactScope['direct'] }) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
        该层级暂无受影响节点
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {nodes.map((node) => (
        <Card key={node.id} className="p-3">
          <div className="flex items-start gap-2">
            {node.depth === 1 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
            ) : (
              <GitBranch className="w-4 h-4 text-[var(--color-text-tertiary)] mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{node.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {node.status}
                </Badge>
                <span className="text-xs text-[var(--color-text-secondary)]">第 {node.depth} 层</span>
              </div>
              {node.path.length > 2 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-text-tertiary)] truncate">
                  {node.path.slice(0, -1).map((id, index) => (
                    <span key={id} className="flex items-center gap-1">
                      {index > 0 && <ArrowRight className="w-3 h-3" />}
                      <span className="truncate max-w-[80px]">{id.slice(-6)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
