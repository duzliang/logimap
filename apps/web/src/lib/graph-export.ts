import type { GraphData, GraphConnection } from '@/api/graph.api'
import type { LogicNode } from '@/types/logic-node.types'

/** 图谱导出工具（T3-20：SVG / PDF / Markdown） */

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '草稿',
  REVIEW: '待评审',
  APPROVED: '已确认',
  DEPRECATED: '已废弃'
}

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: '高',
  NORMAL: '普通',
  LOW: '低'
}

const CONNECTION_LABEL: Record<GraphConnection['type'], string> = {
  TRIGGERS: '触发',
  DEPENDS_ON: '依赖',
  BLOCKS: '阻断',
  EXTENDS: '扩展'
}

export function slugForFile(name: string): string {
  return `logimap-${name || 'graph'}-${new Date().toISOString().split('T')[0]}`
}

/** 由图谱数据构建 Markdown 文档（节点清单 + 关系） */
export function buildGraphMarkdown(data: GraphData, moduleName: string): string {
  const lines: string[] = []
  lines.push(`# ${moduleName || '逻辑图谱'}`)
  lines.push('')
  lines.push(`> 导出时间：${new Date().toLocaleString()}`)
  lines.push('')
  lines.push(`- 节点数：${data.nodes.length}`)
  lines.push(`- 连线数：${data.connections.length}`)
  lines.push('')

  lines.push('## 节点')
  lines.push('')
  if (data.nodes.length === 0) {
    lines.push('（暂无节点）')
    lines.push('')
  }
  for (const node of data.nodes) {
    lines.push(`### ${node.name}`)
    lines.push('')
    const status = STATUS_LABEL[node.status] ?? node.status
    const priority = PRIORITY_LABEL[node.priority] ?? node.priority
    lines.push(`- 状态：${status} ｜ 优先级：${priority}`)
    if (node.summary) lines.push(`- 概述：${node.summary}`)
    if (node.trigger) lines.push(`- 触发条件：${node.trigger}`)
    if (node.dependsOn) lines.push(`- 前置依赖：${node.dependsOn}`)
    if (node.codeRef) lines.push(`- 代码关联：\`${node.codeRef}\``)
    if (node.tags && node.tags.length > 0) lines.push(`- 标签：${node.tags.join(', ')}`)
    lines.push('')
  }

  lines.push('## 关系')
  lines.push('')
  if (data.connections.length === 0) {
    lines.push('（暂无连线）')
    lines.push('')
  } else {
    const nameById = new Map<string, string>(data.nodes.map((n) => [n.id, n.name]))
    for (const conn of data.connections) {
      const source = nameById.get(conn.sourceId) ?? conn.sourceId
      const target = nameById.get(conn.targetId) ?? conn.targetId
      const rel = CONNECTION_LABEL[conn.type] ?? conn.type
      const label = conn.label ? `（${conn.label}）` : ''
      lines.push(`- ${source} —[${rel}]→ ${target}${label}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/** 触发浏览器下载 data URL */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

/** 触发浏览器下载文本内容 */
export function downloadText(content: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 通过打印窗口将图片导出为 PDF（依赖浏览器「另存为 PDF」）。
 * 返回是否成功打开打印窗口。
 */
export function exportImageAsPdf(pngDataUrl: string, title: string): boolean {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>@page { size: landscape; margin: 12mm; } body { margin: 0; }
    img { width: 100%; height: auto; }</style></head>
    <body><img src="${pngDataUrl}" onload="setTimeout(function(){window.focus();window.print();}, 200)" /></body></html>`)
  win.document.close()
  return true
}

export type { GraphData, LogicNode }
