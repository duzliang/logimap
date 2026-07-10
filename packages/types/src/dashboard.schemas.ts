import { z } from 'zod'
import { LogicNodeStatusSchema, NodePrioritySchema } from './logic-node.schemas.js'

/** 仪表盘中出现的精简节点条目（评审待办 / 最近活动共用）。 */
export const DashboardNodeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string().nullable(),
  status: LogicNodeStatusSchema,
  priority: NodePrioritySchema,
  moduleId: z.string(),
  moduleName: z.string(),
  systemId: z.string(),
  systemName: z.string(),
  updatedAt: z.string(),
  updatedByName: z.string().nullable()
})

/** 各状态节点计数（用于状态分布条）。 */
export const DashboardStatusCountsSchema = z.object({
  DRAFT: z.number().int().nonnegative(),
  REVIEW: z.number().int().nonnegative(),
  APPROVED: z.number().int().nonnegative(),
  DEPRECATED: z.number().int().nonnegative()
})

/** 仪表盘汇总响应：统计 + 待办 + 未读 + 最近活动。 */
export const DashboardSummarySchema = z.object({
  counts: z.object({
    systems: z.number().int().nonnegative(),
    modules: z.number().int().nonnegative(),
    nodes: z.number().int().nonnegative()
  }),
  nodesByStatus: DashboardStatusCountsSchema,
  reviewQueue: z.array(DashboardNodeItemSchema),
  recentNodes: z.array(DashboardNodeItemSchema),
  unreadNotifications: z.number().int().nonnegative()
})

export type DashboardNodeItem = z.infer<typeof DashboardNodeItemSchema>
export type DashboardStatusCounts = z.infer<typeof DashboardStatusCountsSchema>
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>
