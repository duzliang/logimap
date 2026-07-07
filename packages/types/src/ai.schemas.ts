import { z } from 'zod'
import { EdgeCaseSchema } from './logic-node.schemas.js'

const branchInputSchema = z.object({
  condition: z.string(),
  action: z.string()
})

const edgeCaseInputSchema = EdgeCaseSchema.omit({ id: true })

export const GenerateNodeSchema = z.object({
  teamId: z.string().min(1),
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
  teamId: z.string().min(1),
  nodeName: z.string().min(1),
  mainFlow: z.string().min(1),
  existingEdgeCases: z.array(edgeCaseInputSchema).optional()
})

export const AnalyzeNodeSchema = z.object({
  teamId: z.string().min(1),
  nodeName: z.string().min(1),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(branchInputSchema).optional(),
  edgeCases: z.array(edgeCaseInputSchema).optional()
})

export const NaturalLanguageQuerySchema = z.object({
  teamId: z.string().min(1),
  question: z.string().min(1),
  systemId: z.string().optional(),
  moduleId: z.string().optional()
})

export const AiAnalyzeImpactSchema = z.object({
  teamId: z.string().min(1),
  nodeId: z.string().min(1),
  direction: z.enum(['downstream', 'upstream', 'both']).default('downstream'),
  maxDepth: z.number().int().min(1).max(5).default(3)
})

export const CreateAiPromptVersionSchema = z.object({
  key: z.string().min(1),
  variant: z.string().default('default'),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  userPromptTemplate: z.string().min(1),
  model: z.string().default('claude-sonnet-4-20250514'),
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().default(2000),
  isDefault: z.boolean().default(false),
  teamId: z.string().optional()
})

export const BatchGenerateNodeSchema = z.object({
  name: z.string().min(1),
  summary: z.string().optional(),
  trigger: z.string().optional(),
  mainFlow: z.string().optional()
})

export const BatchGenerateModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(BatchGenerateNodeSchema).optional()
})

export const BatchGenerateSystemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  modules: z.array(BatchGenerateModuleSchema).optional()
})

export const BatchGenerateResultSchema = z.object({
  systems: z.array(BatchGenerateSystemSchema)
})

export const BatchGenerateSchema = z.object({
  teamId: z.string().min(1),
  requirements: z.string().min(1, '需求描述不能为空'),
  context: z.string().optional()
})

export const AgentContextExportSchema = z.object({
  teamId: z.string().min(1),
  scope: z.enum(['team', 'system', 'module']),
  scopeId: z.string().min(1),
  format: z.enum(['cursorrules', 'agentsmd']).default('cursorrules')
})

export const CheckConsistencySchema = z.object({
  teamId: z.string().min(1),
  nodeId: z.string().min(1)
})

export const ConsistencyResultSchema = z.object({
  consistent: z.boolean(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  suggestions: z.array(z.string())
})

export const NodeAnalysisSchema = z.object({
  completeness: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
  missingEdgeCases: z.array(z.string()),
  recommendedBranches: z.array(z.string())
})

export const TestCaseSchema = z.object({
  name: z.string(),
  steps: z.array(z.string()),
  expected: z.string()
})

export const GeneratedTestCasesSchema = z.object({
  normalCases: z.array(TestCaseSchema),
  edgeCases: z.array(TestCaseSchema),
  branchCases: z.array(
    TestCaseSchema.extend({
      condition: z.string()
    })
  )
})

export type GenerateNodeInput = z.infer<typeof GenerateNodeSchema>
export type SuggestEdgeCasesInput = z.infer<typeof SuggestEdgeCasesSchema>
export type AnalyzeNodeInput = z.infer<typeof AnalyzeNodeSchema>
export type NaturalLanguageQueryInput = z.infer<typeof NaturalLanguageQuerySchema>
export type AiAnalyzeImpactInput = z.infer<typeof AiAnalyzeImpactSchema>
export type CreateAiPromptVersionInput = z.infer<typeof CreateAiPromptVersionSchema>
export type BatchGenerateInput = z.infer<typeof BatchGenerateSchema>
export type BatchGenerateResult = z.infer<typeof BatchGenerateResultSchema>
export type AgentContextExportInput = z.infer<typeof AgentContextExportSchema>
export type CheckConsistencyInput = z.infer<typeof CheckConsistencySchema>
export type ConsistencyResult = z.infer<typeof ConsistencyResultSchema>
export type NodeAnalysis = z.infer<typeof NodeAnalysisSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type GeneratedTestCases = z.infer<typeof GeneratedTestCasesSchema>
