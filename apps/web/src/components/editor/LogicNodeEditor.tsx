import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, X } from 'lucide-react'
import type { Branch, EdgeCase } from '@/types/logic-node.types'

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
  onSave: (data: LogicNodeForm) => void
  onCancel: () => void
  isLoading?: boolean
}

export function LogicNodeEditor({ node, onSave, onCancel, isLoading }: LogicNodeEditorProps) {
  const [tagInput, setTagInput] = useState('')

  const { register, handleSubmit, control, setValue, watch } = useForm<LogicNodeForm>({
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

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
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
              <p className="text-sm text-gray-500 text-center py-4">暂无分支条件</p>
            ) : (
              branchFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="如果..."
                    value={field.condition}
                    onChange={(e) => setValue(`branches.${index}.condition`, e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-gray-400 pt-2">→</span>
                  <Input
                    placeholder="那么..."
                    value={field.action}
                    onChange={(e) => setValue(`branches.${index}.action`, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBranch(index)}
                    className="text-red-500 hover:text-red-700"
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
              <p className="text-sm text-gray-500 text-center py-4">暂无边界条件</p>
            ) : (
              edgeCaseFields.map((field, index) => (
                <div key={field.id} className="grid gap-2 p-3 border rounded-md">
                  <div className="flex gap-2">
                    <Input
                      placeholder="场景描述"
                      value={field.scenario}
                      onChange={(e) => setValue(`edgeCases.${index}.scenario`, e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={field.severity}
                      onChange={(e) => setValue(`edgeCases.${index}.severity`, e.target.value as 'critical' | 'warning' | 'info')}
                      className={cn(
                        'h-10 rounded-md border px-3 text-sm',
                        field.severity === 'critical' ? 'border-red-500 bg-red-50' :
                        field.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
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
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="处理方式"
                    value={field.handling}
                    onChange={(e) => setValue(`edgeCases.${index}.handling`, e.target.value)}
                  />
                </div>
              ))
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
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
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
      <div className="flex justify-end gap-2 pt-4 border-t">
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
