import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button, Input, Label } from '@logimap/ui'
import type { ConnectionType } from '@logimap/types'

interface EdgeEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  edgeData: {
    id: string
    sourceId: string
    targetId: string
    type: ConnectionType
    label?: string
  } | null
  onSave: (data: { type: ConnectionType; label?: string }) => void
  onDelete: () => void
}

const connectionTypes: { value: ConnectionType; label: string; description: string }[] = [
  { value: 'TRIGGERS', label: '触发', description: 'A 触发 B 执行' },
  { value: 'DEPENDS_ON', label: '依赖', description: 'A 依赖于 B' },
  { value: 'BLOCKS', label: '阻断', description: 'A 阻断 B 执行' },
  { value: 'EXTENDS', label: '扩展', description: 'A 是 B 的扩展' },
]

export function EdgeEditDialog({ open, onOpenChange, edgeData, onSave, onDelete }: EdgeEditDialogProps) {
  const [type, setType] = useState<ConnectionType>('TRIGGERS')
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (edgeData) {
      setType(edgeData.type)
      setLabel(edgeData.label || '')
    }
  }, [edgeData])

  const handleSave = () => {
    onSave({ type, label: label || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑连线</DialogTitle>
          <DialogDescription>
            修改连线类型和标签
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">连线类型</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ConnectionType)}
              className="flex h-10 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
            >
              {connectionTypes.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label} - {ct.description}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="label">标签（可选）</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入连线标签"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onDelete} className="text-[var(--color-error-text)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-error-bg)]">
            删除连线
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}