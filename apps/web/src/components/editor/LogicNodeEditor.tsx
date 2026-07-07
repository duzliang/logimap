import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button, Input, Textarea, Label, Badge, cn } from '@logimap/ui'
import { Plus, Trash2, X, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateNodeContent, suggestEdgeCases, analyzeNode, generateTestCases, checkCodeConsistency } from '@/api/ai.api'
import type { Branch, EdgeCase, NodeAnalysis, GeneratedTestCases } from '@logimap/types'

interface LogicNodeForm {
  name: string
  summary?: string
  trigger?: string
  dependsOn?: string
  mainFlow?: string
  branches: Branch[]
  edgeCases: EdgeCase[]
  codeRef?: string
  tags: string[]
  notes?: string
}

interface LogicNodeEditorProps {
  node?: Partial<LogicNodeForm>
  nodeId?: string
  onSave: (data: LogicNodeForm) => void
  onCancel: () => void
  isLoading?: boolean
  teamId?: string
  moduleContext?: string
}

export function LogicNodeEditor({ node, nodeId, onSave, onCancel, isLoading, teamId, moduleContext }: LogicNodeEditorProps) {
  const [tagInput, setTagInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<NodeAnalysis | null>(null)
  const [testCasesResult, setTestCasesResult] = useState<GeneratedTestCases | null>(null)

  const { register, handleSubmit, control, setValue, watch, getValues } = useForm<LogicNodeForm>({
    defaultValues: {
      name: node?.name || '',
      summary: node?.summary || '',
      trigger: node?.trigger || '',
      dependsOn: node?.dependsOn || '',
      mainFlow: node?.mainFlow || '',
      branches: node?.branches || [],
      edgeCases: node?.edgeCases || [],
      codeRef: node?.codeRef || '',
      tags: node?.tags || [],
      notes: node?.notes || ''
    }
  })

  const tags = watch('tags')
  const nodeName = watch('name')
  const edgeCases = watch('edgeCases')

  const {
    fields: branchFields,
    append: appendBranch,
    remove: removeBranch
  } = useFieldArray({
    control,
    name: 'branches'
  })

  const {
    fields: edgeCaseFields,
    append: appendEdgeCase,
    remove: removeEdgeCase
  } = useFieldArray({
    control,
    name: 'edgeCases'
  })

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // AI 生成节点内容
  const handleAiGenerate = async () => {
    if (!nodeName) {
      toast.error('请先输入节点名称')
      return
    }

    if (!teamId) {
      toast.error('未选择团队')
      return
    }

    setIsAiLoading(true)
    try {
      const result = await generateNodeContent(teamId, {
        nodeName,
        moduleContext,
        existingContent: {
          trigger: getValues('trigger'),
          dependsOn: getValues('dependsOn'),
          mainFlow: getValues('mainFlow')
        }
      })

      if (result.trigger) setValue('trigger', result.trigger)
      if (result.dependsOn) setValue('dependsOn', result.dependsOn)
      if (result.mainFlow) setValue('mainFlow', result.mainFlow)

      result.branches?.forEach((branch) => {
        appendBranch({ id: Date.now().toString() + Math.random(), condition: branch.condition, action: branch.action })
      })

      result.edgeCases?.forEach((edgeCase) => {
        appendEdgeCase({
          id: Date.now().toString() + Math.random(),
          scenario: edgeCase.scenario,
          handling: edgeCase.handling,
          severity: edgeCase.severity
        })
      })

      toast.success('AI 内容已生成')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 生成失败'
      toast.error(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // AI 建议边界条件
  const handleAiSuggestEdgeCases = async () => {
    const mainFlow = getValues('mainFlow')
    if (!nodeName) {
      toast.error('请先输入节点名称')
      return
    }
    if (!mainFlow) {
      toast.error('请先填写主流程')
      return
    }

    if (!teamId) {
      toast.error('未选择团队')
      return
    }

    setIsAiLoading(true)
    try {
      const existingEdgeCases = getValues('edgeCases').map(e => ({
        scenario: e.scenario,
        handling: e.handling,
        severity: e.severity as 'critical' | 'warning' | 'info'
      }))

      const result = await suggestEdgeCases(teamId, {
        nodeName,
        mainFlow,
        existingEdgeCases
      })

      result.forEach((edgeCase) => {
        appendEdgeCase({
          id: Date.now().toString() + Math.random(),
          scenario: edgeCase.scenario,
          handling: edgeCase.handling,
          severity: edgeCase.severity
        })
      })

      toast.success(`已添加 ${result.length} 个边界条件建议`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 建议生成失败'
      toast.error(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // AI 分析完整性
  const handleAiAnalyze = async () => {
    if (!teamId) {
      toast.error('未选择团队')
      return
    }
    if (!nodeName) {
      toast.error('请先输入节点名称')
      return
    }

    setIsAiLoading(true)
    try {
      const result = await analyzeNode(teamId, {
        nodeName,
        trigger: getValues('trigger'),
        dependsOn: getValues('dependsOn'),
        mainFlow: getValues('mainFlow'),
        branches: getValues('branches'),
        edgeCases: getValues('edgeCases')
      })
      setAnalysisResult(result)
      toast.success(`完整性评分：${result.completeness}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 分析失败'
      toast.error(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // AI 生成测试用例
  const handleAiTests = async () => {
    if (!teamId) {
      toast.error('未选择团队')
      return
    }
    if (!nodeName) {
      toast.error('请先输入节点名称')
      return
    }

    setIsAiLoading(true)
    try {
      const result = await generateTestCases(teamId, {
        nodeName,
        trigger: getValues('trigger'),
        dependsOn: getValues('dependsOn'),
        mainFlow: getValues('mainFlow'),
        branches: getValues('branches'),
        edgeCases: getValues('edgeCases')
      })
      setTestCasesResult(result)
      toast.success('测试用例已生成')
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试用例生成失败'
      toast.error(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // AI 代码一致性检查
  const handleAiConsistency = async () => {
    if (!teamId) {
      toast.error('未选择团队')
      return
    }
    if (!nodeId) {
      toast.error('请先保存节点后再检查一致性')
      return
    }

    setIsAiLoading(true)
    try {
      const result = await checkCodeConsistency({ teamId, nodeId })
      const status = result.consistent ? '一致' : '不一致'
      toast.success(`代码一致性：${status}（${result.score} 分）`, {
        description: result.reason
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '一致性检查失败'
      toast.error(message)
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      {/* AI 辅助按钮 */}
      <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-brand-subtle)] rounded-lg border border-[var(--color-brand-muted)]">
        <Sparkles className="h-5 w-5 text-[var(--color-brand-default)]" />
        <span className="text-sm text-[var(--color-brand-hover)] font-medium">AI 辅助</span>
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiGenerate}
            disabled={isAiLoading || !nodeName}
            className="bg-[var(--color-brand-default)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-hover)]"
          >
            {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            生成内容
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiSuggestEdgeCases}
            disabled={isAiLoading || !nodeName}
          >
            边界建议
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiAnalyze}
            disabled={isAiLoading || !nodeName}
          >
            分析完整性
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiTests}
            disabled={isAiLoading || !nodeName}
          >
            生成测试
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAiConsistency}
            disabled={isAiLoading || !nodeId}
          >
            代码一致性
          </Button>
        </div>
      </div>

      {/* AI 分析结果 */}
      {analysisResult && (
        <div className="p-4 border border-[var(--color-border-default)] rounded-lg bg-[var(--color-bg-elevated)] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">完整性分析</h4>
            <span className="text-sm font-medium text-[var(--color-brand-hover)]">{analysisResult.completeness}/100</span>
          </div>
          {analysisResult.suggestions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">改进建议</p>
              <ul className="text-sm text-[var(--color-text-secondary)] list-disc list-inside space-y-1">
                {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {analysisResult.missingEdgeCases.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">可能遗漏的边界</p>
              <ul className="text-sm text-[var(--color-text-secondary)] list-disc list-inside space-y-1">
                {analysisResult.missingEdgeCases.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {analysisResult.recommendedBranches.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">建议分支</p>
              <ul className="text-sm text-[var(--color-text-secondary)] list-disc list-inside space-y-1">
                {analysisResult.recommendedBranches.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI 测试用例结果 */}
      {testCasesResult && (
        <div className="p-4 border border-[var(--color-border-default)] rounded-lg bg-[var(--color-bg-elevated)] space-y-4">
          <h4 className="font-semibold">测试用例建议</h4>
          {testCasesResult.normalCases.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">正常流程</p>
              <div className="space-y-2">
                {testCasesResult.normalCases.map((tc, i) => (
                  <div key={i} className="text-sm border-l-2 border-[var(--color-brand-default)] pl-3">
                    <p className="font-medium">{tc.name}</p>
                    <ol className="list-decimal list-inside text-[var(--color-text-secondary)]">
                      {tc.steps.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                    <p className="text-[var(--color-text-tertiary)]">预期：{tc.expected}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {testCasesResult.edgeCases.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">边界条件</p>
              <div className="space-y-2">
                {testCasesResult.edgeCases.map((tc, i) => (
                  <div key={i} className="text-sm border-l-2 border-[var(--color-warning-icon)] pl-3">
                    <p className="font-medium">{tc.name}</p>
                    <ol className="list-decimal list-inside text-[var(--color-text-secondary)]">
                      {tc.steps.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                    <p className="text-[var(--color-text-tertiary)]">预期：{tc.expected}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {testCasesResult.branchCases.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">分支覆盖</p>
              <div className="space-y-2">
                {testCasesResult.branchCases.map((tc, i) => (
                  <div key={i} className="text-sm border-l-2 border-[var(--color-info-icon)] pl-3">
                    <p className="font-medium">{tc.name} <span className="text-[var(--color-text-tertiary)]">（{tc.condition}）</span></p>
                    <ol className="list-decimal list-inside text-[var(--color-text-secondary)]">
                      {tc.steps.map((step, idx) => <li key={idx}>{step}</li>)}
                    </ol>
                    <p className="text-[var(--color-text-tertiary)]">预期：{tc.expected}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本信息</h3>

        <div className="grid gap-2">
          <Label htmlFor="name">节点名称 *</Label>
          <Input id="name" placeholder="例如：工单结算" {...register('name', { required: '请输入节点名称' })} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="summary">一句话概述</Label>
          <Textarea
            id="summary"
            placeholder="简要描述此节点的作用"
            className="min-h-[60px]"
            {...register('summary')}
          />
        </div>
      </div>

      {/* 6 个核心字段 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">核心字段</h3>

        {/* 字段 1: 触发条件 */}
        <div className="grid gap-2">
          <Label htmlFor="trigger">1. 触发条件</Label>
          <Textarea
            id="trigger"
            placeholder="什么情况下触发此逻辑？例如：维修工单状态变为「完成」"
            className="min-h-[80px]"
            {...register('trigger')}
          />
        </div>

        {/* 字段 2: 前置依赖 */}
        <div className="grid gap-2">
          <Label htmlFor="dependsOn">2. 前置依赖</Label>
          <Textarea
            id="dependsOn"
            placeholder="需要哪些前置条件或依赖？例如：客户确认结算单"
            className="min-h-[80px]"
            {...register('dependsOn')}
          />
        </div>

        {/* 字段 3: 主流程 */}
        <div className="grid gap-2">
          <Label htmlFor="mainFlow">3. 主流程</Label>
          <Textarea
            id="mainFlow"
            placeholder="正常路径的步骤描述，使用有序列表：&#10;1. 第一步&#10;2. 第二步&#10;3. 第三步"
            className="min-h-[120px]"
            {...register('mainFlow')}
          />
        </div>

        {/* 字段 4: 分支条件 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>4. 分支条件</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => appendBranch({ id: Date.now().toString(), condition: '', action: '' })}>
              <Plus className="h-4 w-4 mr-2" />
              添加分支
            </Button>
          </div>
          <div className="space-y-2">
            {branchFields.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">暂无分支条件</p>
            ) : (
              branchFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="如果..."
                    {...register(`branches.${index}.condition`)}
                    className="flex-1"
                  />
                  <span className="text-[var(--color-text-tertiary)] pt-2">→</span>
                  <Input
                    placeholder="那么..."
                    {...register(`branches.${index}.action`)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBranch(index)}
                    className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 字段 5: 边界条件 */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>5. 边界条件</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendEdgeCase({ id: Date.now().toString(), scenario: '', handling: '', severity: 'warning' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加边界
            </Button>
          </div>
          <div className="space-y-2">
            {edgeCaseFields.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">暂无边界条件</p>
            ) : (
              edgeCaseFields.map((field, index) => {
                const severity = edgeCases?.[index]?.severity || 'warning'
                return (
                  <div key={field.id} className="grid gap-2 p-3 border border-[var(--color-border-default)] rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="场景描述"
                        {...register(`edgeCases.${index}.scenario`)}
                        className="flex-1"
                      />
                      <select
                        {...register(`edgeCases.${index}.severity`)}
                        className={cn(
                          'h-10 rounded-lg border border-[var(--color-border-default)] px-3 text-sm',
                          severity === 'critical' ? 'border-[var(--color-error-icon)] bg-[var(--color-error-bg)]' :
                          severity === 'warning' ? 'border-[var(--color-warning-icon)] bg-[var(--color-warning-bg)]' :
                          'border-[var(--color-info-icon)] bg-[var(--color-info-bg)]'
                        )}
                      >
                        <option value="critical">严重</option>
                        <option value="warning">警告</option>
                        <option value="info">提示</option>
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEdgeCase(index)}
                        className="text-[var(--color-error-icon)] hover:text-[var(--color-error-text)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="处理方式"
                      {...register(`edgeCases.${index}.handling`)}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 字段 6: 代码关联 */}
        <div className="grid gap-2">
          <Label htmlFor="codeRef">6. 代码关联</Label>
          <Input
            id="codeRef"
            placeholder="例如：src/services/settlement.ts#calculateSettlement"
            {...register('codeRef')}
          />
        </div>
      </div>

      {/* 标签 */}
      <div className="grid gap-2">
        <Label>标签</Label>
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--color-error-icon)]">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="输入标签后按回车添加"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            添加
          </Button>
        </div>
      </div>

      {/* 备注 */}
      <div className="grid gap-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          placeholder="其他需要说明的信息"
          className="min-h-[80px]"
          {...register('notes')}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-default)]">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  )
}

