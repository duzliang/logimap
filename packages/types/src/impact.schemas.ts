import { z } from 'zod'
import { ConnectionTypeSchema } from './graph.schemas.js'

export const ImpactDirectionSchema = z.enum(['downstream', 'upstream', 'both'])

export const AnalyzeImpactSchema = z.object({
  nodeId: z.string().min(1),
  direction: ImpactDirectionSchema.default('downstream'),
  maxDepth: z.number().int().min(1).max(5).default(3)
})

export const HypotheticalConnectionSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: ConnectionTypeSchema.optional()
})

export const WhatIfImpactSchema = z.object({
  nodeId: z.string().min(1),
  direction: ImpactDirectionSchema.default('downstream'),
  maxDepth: z.number().int().min(1).max(5).default(3),
  addConnections: z.array(HypotheticalConnectionSchema).optional(),
  removeConnectionIds: z.array(z.string()).optional()
})

export const ImpactNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  depth: z.number().int(),
  path: z.array(z.string())
})

export const ImpactPathSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  type: ConnectionTypeSchema,
  depth: z.number().int()
})

export const ImpactScopeSchema = z.object({
  startNodeId: z.string(),
  direction: ImpactDirectionSchema,
  maxDepth: z.number().int(),
  direct: z.array(ImpactNodeSchema),
  indirect: z.array(ImpactNodeSchema),
  thirdLevel: z.array(ImpactNodeSchema),
  paths: z.array(ImpactPathSchema)
})

export const CreateImpactReportSchema = z.object({
  nodeId: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  direction: ImpactDirectionSchema.default('downstream'),
  maxDepth: z.number().int().min(1).max(5).default(3)
})

export const ListImpactReportsSchema = z.object({
  nodeId: z.string().optional(),
  moduleId: z.string().optional()
})

export type AnalyzeImpactInput = z.infer<typeof AnalyzeImpactSchema>
export type WhatIfImpactInput = z.infer<typeof WhatIfImpactSchema>
export type ImpactScope = z.infer<typeof ImpactScopeSchema>
export type CreateImpactReportInput = z.infer<typeof CreateImpactReportSchema>
export type ListImpactReportsInput = z.infer<typeof ListImpactReportsSchema>
export type ImpactDirection = z.infer<typeof ImpactDirectionSchema>
