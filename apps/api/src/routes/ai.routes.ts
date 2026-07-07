import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  GenerateNodeSchema,
  SuggestEdgeCasesSchema,
  AnalyzeNodeSchema,
  NaturalLanguageQuerySchema,
  AiAnalyzeImpactSchema,
  CreateAiPromptVersionSchema,
  BatchGenerateSchema,
  AgentContextExportSchema,
  CheckConsistencySchema
} from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { AIService } from '../services/ai.service.js'
import { NlQueryService } from '../services/nl-query.service.js'
import { AiImpactAnalysisService } from '../services/ai-impact-analysis.service.js'
import { AiPromptService } from '../services/ai-prompt.service.js'
import { BatchGenerationService } from '../services/batch-generation.service.js'
import { AgentContextService } from '../services/agent-context.service.js'
import { CodeConsistencyService } from '../services/code-consistency.service.js'

const aiService = new AIService()
const nlQueryService = new NlQueryService()
const aiImpactService = new AiImpactAnalysisService()
const promptService = new AiPromptService()
const batchService = new BatchGenerationService()
const agentContextService = new AgentContextService()
const consistencyService = new CodeConsistencyService()

export const aiRoutes = new Hono()
  .use('*', authMiddleware)
  .post('/generate-node', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', GenerateNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateNodeContent(input, input.teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/suggest-edge-cases', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', SuggestEdgeCasesSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.suggestEdgeCases(input, input.teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 建议生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/analyze-node', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.analyzeNode(input, input.teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 分析失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/generate-tests', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateTestCases(input, input.teamId)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试用例生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/nl-query', requireTeamRole('VIEWER', teamResolvers.fromBodyTeamId), zValidator('json', NaturalLanguageQuerySchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await nlQueryService.answer(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/analyze-impact', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', AiAnalyzeImpactSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiImpactService.analyze(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 影响分析失败'
      return c.json({ error: message }, 500)
    }
  })
  .get('/prompt-versions', requireTeamRole('ADMIN', teamResolvers.fromQuery('teamId')), async (c) => {
    try {
      const teamId = c.req.query('teamId')
      const prompts = await promptService.listPrompts(undefined, teamId)
      return c.json({ data: prompts })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/prompt-versions', requireTeamRole('ADMIN', teamResolvers.fromBodyTeamId), zValidator('json', CreateAiPromptVersionSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const prompt = await promptService.createPrompt(input)
      return c.json({ data: prompt })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/batch-generate', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', BatchGenerateSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await batchService.generate(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '批量生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/agent-context', requireTeamRole('VIEWER', teamResolvers.fromBodyTeamId), zValidator('json', AgentContextExportSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await agentContextService.generate(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/check-consistency', requireTeamRole('MEMBER', teamResolvers.fromBodyTeamId), zValidator('json', CheckConsistencySchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await consistencyService.check(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '一致性检查失败'
      return c.json({ error: message }, 500)
    }
  })
