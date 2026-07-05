import { z } from 'zod'
import { EdgeCaseSchema } from './logic-node.schemas.js'

const branchInputSchema = z.object({
  condition: z.string(),
  action: z.string()
})

const edgeCaseInputSchema = EdgeCaseSchema.omit({ id: true })

export const GenerateNodeSchema = z.object({
  nodeName: z.string().min(1, '节点名称不能为空'),
  moduleContext: z.string().optional(),
  existingContent: z.object({
    trigger: z.string().optional(),
    dependsOn: z.string().optional(),
    mainFlow: z.string().optional(),
    branches: z.array(branchInputSchema).optional(),
    edgeCases: z.array(edgeCaseInputSchema).optional()
  }).optional()
})

export const SuggestEdgeCasesSchema = z.object({
  nodeName: z.string().min(1),
  mainFlow: z.string().min(1),
  existingEdgeCases: z.array(edgeCaseInputSchema).optional()
})

export const AnalyzeNodeSchema = z.object({
  nodeName: z.string().min(1),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(branchInputSchema).optional(),
  edgeCases: z.array(edgeCaseInputSchema).optional()
})

export type GenerateNodeInput = z.infer<typeof GenerateNodeSchema>
export type SuggestEdgeCasesInput = z.infer<typeof SuggestEdgeCasesSchema>
export type AnalyzeNodeInput = z.infer<typeof AnalyzeNodeSchema>
