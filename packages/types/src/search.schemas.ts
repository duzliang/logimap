import { z } from 'zod'
import { LogicNodeStatusSchema, NodePrioritySchema } from './logic-node.schemas.js'

export const SearchResultTypeSchema = z.enum(['system', 'module', 'node'])
export type SearchResultType = z.infer<typeof SearchResultTypeSchema>

export const SearchQuerySchema = z.object({
  q: z.string().max(100).optional(),
  teamId: z.string().optional(),
  systemId: z.string().optional(),
  moduleId: z.string().optional(),
  type: z.enum(['all', 'system', 'module', 'node']).default('all'),
  statuses: z.string().optional(),
  priorities: z.string().optional(),
  tags: z.string().optional(),
  assigneeId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>

export const SearchAssigneeSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string()
})

export const SearchResultItemSchema = z.object({
  type: SearchResultTypeSchema,
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  href: z.string(),
  teamId: z.string(),
  systemId: z.string().optional(),
  moduleId: z.string().optional(),
  status: LogicNodeStatusSchema.optional(),
  priority: NodePrioritySchema.optional(),
  tags: z.array(z.string()).optional(),
  assignee: SearchAssigneeSchema.nullable().optional(),
  rank: z.number().optional()
})

export type SearchResultItem = z.infer<typeof SearchResultItemSchema>

export const SearchResultsGroupSchema = z.object({
  items: z.array(SearchResultItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int()
})

export type SearchResultsGroup = z.infer<typeof SearchResultsGroupSchema>

export const SearchResponseSchema = z.object({
  systems: SearchResultsGroupSchema,
  modules: SearchResultsGroupSchema,
  nodes: SearchResultsGroupSchema
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>

export const SearchNodeMatchSchema = z.object({
  nodeIds: z.array(z.string())
})

export type SearchNodeMatchResponse = z.infer<typeof SearchNodeMatchSchema>
