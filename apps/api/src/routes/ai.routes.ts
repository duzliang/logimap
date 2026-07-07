import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  GenerateNodeSchema,
  SuggestEdgeCasesSchema,
  AnalyzeNodeSchema,
  NaturalLanguageQuerySchema,
  AiAnalyzeImpactSchema,
  CreateAiPromptVersionSchema
} from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { AIService } from '../services/ai.service.js'
import { NlQueryService } from '../services/nl-query.service.js'
import { AiImpactAnalysisService } from '../services/ai-impact-analysis.service.js'
import { AiPromptService } from '../services/ai-prompt.service.js'

const aiService = new AIService()
const nlQueryService = new NlQueryService()
const aiImpactService = new AiImpactAnalysisService()
const promptService = new AiPromptService()

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
