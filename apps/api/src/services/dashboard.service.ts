import { prisma } from '../db/prisma.js'
import type {
  DashboardSummary,
  DashboardNodeItem,
  DashboardStatusCounts
} from '@logimap/types'

const REVIEW_QUEUE_LIMIT = 6
const RECENT_NODES_LIMIT = 6

/** findMany + include 后的节点形状，用于映射为 DashboardNodeItem。 */
type NodeWithContext = {
  id: string
  name: string
  summary: string | null
  status: string
  priority: string
  updatedAt: Date
  module: {
    id: string
    name: string
    system: { id: string; name: string }
  }
  updatedBy: { name: string } | null
}

const nodeInclude = {
  module: {
    select: {
      id: true,
      name: true,
      system: { select: { id: true, name: true } }
    }
  },
  updatedBy: { select: { name: true } }
} as const

function toNodeItem(node: NodeWithContext): DashboardNodeItem {
  return {
    id: node.id,
    name: node.name,
    summary: node.summary,
    status: node.status as DashboardNodeItem['status'],
    priority: node.priority as DashboardNodeItem['priority'],
    moduleId: node.module.id,
    moduleName: node.module.name,
    systemId: node.module.system.id,
    systemName: node.module.system.name,
    updatedAt: node.updatedAt.toISOString(),
    updatedByName: node.updatedBy?.name ?? null
  }
}

export class DashboardService {
  /**
   * 汇总某团队的仪表盘数据：实体计数、状态分布、评审待办、最近活动、当前用户未读通知。
   * 所有节点范围通过 module.system.teamId 收敛到该团队。
   */
  async getSummary(teamId: string, userId: string): Promise<DashboardSummary> {
    const nodeTeamScope = { module: { system: { teamId } } }

    const [
      systemsCount,
      modulesCount,
      statusGroups,
      reviewQueue,
      recentNodes,
      unreadNotifications
    ] = await Promise.all([
      prisma.system.count({ where: { teamId } }),
      prisma.module.count({ where: { system: { teamId } } }),
      prisma.logicNode.groupBy({
        by: ['status'],
        where: nodeTeamScope,
        _count: { _all: true }
      }),
      prisma.logicNode.findMany({
        where: { ...nodeTeamScope, status: 'REVIEW' },
        orderBy: { updatedAt: 'desc' },
        take: REVIEW_QUEUE_LIMIT,
        include: nodeInclude
      }),
      prisma.logicNode.findMany({
        where: nodeTeamScope,
        orderBy: { updatedAt: 'desc' },
        take: RECENT_NODES_LIMIT,
        include: nodeInclude
      }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ])

    const nodesByStatus: DashboardStatusCounts = {
      DRAFT: 0,
      REVIEW: 0,
      APPROVED: 0,
      DEPRECATED: 0
    }
    for (const group of statusGroups) {
      const status = group.status as keyof DashboardStatusCounts
      if (status in nodesByStatus) {
        nodesByStatus[status] = group._count._all
      }
    }

    const nodesCount =
      nodesByStatus.DRAFT +
      nodesByStatus.REVIEW +
      nodesByStatus.APPROVED +
      nodesByStatus.DEPRECATED

    return {
      counts: {
        systems: systemsCount,
        modules: modulesCount,
        nodes: nodesCount
      },
      nodesByStatus,
      reviewQueue: reviewQueue.map(toNodeItem),
      recentNodes: recentNodes.map(toNodeItem),
      unreadNotifications
    }
  }
}
