import { useState } from 'react'
import { Button, Textarea } from '@logimap/ui'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { nlQuery } from '@/api/ai.api'
import type { NlQueryResponse } from '@/api/ai.api'

interface NaturalLanguageQueryProps {
  teamId: string
  onNodeClick?: (nodeId: string, moduleId: string) => void
}

export function NaturalLanguageQuery({ teamId, onNodeClick }: NaturalLanguageQueryProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<NlQueryResponse['sources']>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error('请输入问题')
      return
    }

    setIsLoading(true)
    try {
      const result = await nlQuery({ teamId, question })
      setAnswer(result.answer)
      setSources(result.sources)
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
      <h2 className="font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[var(--color-brand-default)]" />
        AI 自然语言查询
      </h2>

      <Textarea
        placeholder="例如：工单结算依赖哪些节点？"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[80px] mb-3"
      />

      <Button
        type="button"
        onClick={handleAsk}
        disabled={isLoading || !question.trim()}
        className="w-full"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        提问
      </Button>

      {answer && (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-[var(--color-brand-subtle)] rounded-lg border border-[var(--color-brand-muted)]">
            <p className="text-sm text-[var(--color-text-primary)]">{answer}</p>
          </div>

          {sources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">引用节点</p>
              <ul className="space-y-1">
                {sources.map((source) => (
                  <li key={source.id}>
                    {onNodeClick ? (
                      <button
                        type="button"
                        onClick={() => onNodeClick(source.id, source.moduleId)}
                        className="text-sm text-[var(--color-brand-hover)] hover:underline text-left"
                      >
                        {source.name}
                      </button>
                    ) : (
                      <span className="text-sm text-[var(--color-text-secondary)]">{source.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
