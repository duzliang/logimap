import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea
} from '@logimap/ui'
import { Bot, Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'
import { generateAgentContext } from '@/api/ai.api'

interface AgentContextExportProps {
  teamId: string
}

export function AgentContextExport({ teamId }: AgentContextExportProps) {
  const [format, setFormat] = useState<'cursorrules' | 'agentsmd'>('cursorrules')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const data = await generateAgentContext({ teamId, scope: 'team', scopeId: teamId, format })
      setOutput(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const filename = format === 'cursorrules' ? '.cursorrules' : 'AGENTS.md'
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agent 上下文导出
          </CardTitle>
          <CardDescription>生成 .cursorrules 或 AGENTS.md 片段，供 Cursor / Claude Code 读取</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormat('cursorrules')}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              format === 'cursorrules'
                ? 'bg-[var(--color-brand-default)] text-[var(--color-text-inverse)] border-[var(--color-brand-default)]'
                : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]'
            }`}
          >
            .cursorrules
          </button>
          <button
            type="button"
            onClick={() => setFormat('agentsmd')}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              format === 'agentsmd'
                ? 'bg-[var(--color-brand-default)] text-[var(--color-text-inverse)] border-[var(--color-brand-default)]'
                : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]'
            }`}
          >
            AGENTS.md
          </button>
        </div>

        <Button type="button" onClick={handleGenerate} disabled={isLoading} className="w-full">
          {isLoading ? '生成中...' : '生成 Agent 上下文'}
        </Button>

        {output && (
          <>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? '已复制' : '复制'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
            </div>
            <Textarea readOnly value={output} className="min-h-[300px] font-mono text-xs" />
          </>
        )}
      </CardContent>
    </Card>
  )
}
