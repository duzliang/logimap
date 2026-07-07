import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import type { ImpactScope } from './impact-analysis.service.js'

export interface ReportInput {
  nodeId: string
  moduleId: string
  title: string
  direction: string
  maxDepth: number
  scope: ImpactScope
}

export class ImpactReportService {
  /**
   * 根据影响范围生成 Markdown 报告
   */
  generateMarkdownReport(nodeName: string, scope: ImpactScope): string {
    const directionLabel: Record<string, string> = {
      downstream: '下游影响',
      upstream: '上游依赖',
      both: '上下游影响'
    }

    const lines: string[] = []
    lines.push(`# 变更影响报告：${nodeName}`)
    lines.push('')
    lines.push(`- **分析方向**：${directionLabel[scope.direction] ?? scope.direction}`)
    lines.push(`- **最大深度**：${scope.maxDepth} 层`)
    lines.push(`- **生成时间**：${new Date().toLocaleString('zh-CN')}`)
    lines.push('')

    lines.push('## 影响概览')
    lines.push('')
    lines.push(`| 层级 | 节点数量 |`)
    lines.push(`|------|----------|`)
    lines.push(`| 直接影响 | ${scope.direct.length} |`)
    lines.push(`| 间接影响（2 层） | ${scope.indirect.length} |`)
    lines.push(`| 第三层影响 | ${scope.thirdLevel.length} |`)
    lines.push('')

    const allNodes = [...scope.direct, ...scope.indirect, ...scope.thirdLevel]

    if (allNodes.length > 0) {
      lines.push('## 受影响节点列表')
      lines.push('')
      lines.push(`| 节点 | 状态 | 距离 | 路径 |`)
      lines.push(`|------|------|------|------|`)
      for (const node of allNodes) {
        const pathNames = node.path.join(' → ')
        lines.push(`| ${node.name} | ${node.status} | ${node.depth} 层 | ${pathNames} |`)
      }
      lines.push('')
    }

    if (scope.paths.length > 0) {
      lines.push('## 关系路径')
      lines.push('')
      for (const path of scope.paths) {
        lines.push(`- ${path.fromId} —${path.type}→ ${path.toId}（第 ${path.depth} 层）`)
      }
      lines.push('')
    }

    lines.push('## 备注')
    lines.push('')
    lines.push('本报告由 LogiMap 影响分析引擎自动生成，供变更评估参考。')
    lines.push('')

    return lines.join('\n')
  }

  /**
   * 保存报告到数据库
   */
  async saveReport(input: ReportInput, createdById?: string) {
    const node = await prisma.logicNode.findUnique({
      where: { id: input.nodeId },
      select: { name: true }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    const reportMarkdown = this.generateMarkdownReport(node.name, input.scope)

    return prisma.impactAnalysisReport.create({
      data: {
        id: generateId(),
        nodeId: input.nodeId,
        moduleId: input.moduleId,
        title: input.title,
        direction: input.direction,
        maxDepth: input.maxDepth,
        scope: input.scope as never,
        reportMarkdown,
        createdById
      }
    })
  }

  /**
   * 根据 ID 查询报告
   */
  async getReport(reportId: string) {
    return prisma.impactAnalysisReport.findUnique({
      where: { id: reportId }
    })
  }

  /**
   * 列出报告
   */
  async listReports(filters: { nodeId?: string; moduleId?: string } = {}) {
    return prisma.impactAnalysisReport.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }
}
