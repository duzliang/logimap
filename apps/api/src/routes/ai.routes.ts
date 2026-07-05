import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { GenerateNodeSchema, SuggestEdgeCasesSchema, AnalyzeNodeSchema } from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { AIService } from '../services/ai.service.js'

const aiService = new AIService()

export const aiRoutes = new Hono()
  .use('*', authMiddleware)
  .use('*', requireTeamRole('MEMBER', teamResolvers.fromQuery('teamId')))
  .post('/generate-node', zValidator('json', GenerateNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateNodeContent(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/suggest-edge-cases', zValidator('json', SuggestEdgeCasesSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.suggestEdgeCases(
        input.nodeName,
        input.mainFlow,
        input.existingEdgeCases?.map(e => ({ scenario: e.scenario, handling: e.handling }))
      )
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 建议生成失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/analyze-node', zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.analyzeNode(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 分析失败'
      return c.json({ error: message }, 500)
    }
  })
  .post('/generate-tests', zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateTestCases(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试用例生成失败'
      return c.json({ error: message }, 500)
    }
  })
