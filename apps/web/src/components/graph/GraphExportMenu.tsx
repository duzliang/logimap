import { useState } from 'react'
import { Button } from '@logimap/ui'
import { Download, Image, FileCode, FileText, FileType } from 'lucide-react'

export type GraphExportFormat = 'png' | 'svg' | 'pdf' | 'markdown'

interface GraphExportMenuProps {
  onExport: (format: GraphExportFormat) => void
}

const items: Array<{ format: GraphExportFormat; label: string; icon: React.ElementType }> = [
  { format: 'png', label: 'PNG 图片', icon: Image },
  { format: 'svg', label: 'SVG 矢量图', icon: FileCode },
  { format: 'pdf', label: 'PDF 文档', icon: FileType },
  { format: 'markdown', label: 'Markdown', icon: FileText }
]

export function GraphExportMenu({ onExport }: GraphExportMenuProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (format: GraphExportFormat) => {
    setOpen(false)
    onExport(format)
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-label="导出">
        <Download className="w-4 h-4" />
      </Button>
      {open && (
        <>
          {/* 点击遮罩关闭 */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 min-w-[168px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] shadow-md py-1">
            {items.map((item) => (
              <button
                key={item.format}
                type="button"
                onClick={() => handleSelect(item.format)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)]"
              >
                <item.icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
