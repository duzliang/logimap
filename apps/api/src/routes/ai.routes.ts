import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { AIService } from '../services/ai.service.js'

const aiService = new AIService()

const GenerateNodeSchema = z.object({
  nodeName: z.string().min(1, '节点名称不能为空'),
  moduleContext: z.string().optional(),
  existingContent: z.object({
    trigger: z.string().optional(),
    dependsOn: z.string().optional(),
    mainFlow: z.string().optional(),
    branches: z.array(z.object({
      condition: z.string(),
      action: z.string()
    })).optional(),
    edgeCases: z.array(z.object({
      scenario: z.string(),
      handling: z.string(),
      severity: z.enum(['critical', 'warning', 'info'])
    })).optional()
  }).optional()
})

const SuggestEdgeCasesSchema = z.object({
  nodeName: z.string().min(1),
  mainFlow: z.string().min(1),
  existingEdgeCases: z.array(z.object({
    scenario: z.string(),
    handling: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })).optional()
})

const AnalyzeNodeSchema = z.object({
  nodeName: z.string().min(1),
  trigger: z.string().optional(),
  dependsOn: z.string().optional(),
  mainFlow: z.string().optional(),
  branches: z.array(z.object({
    condition: z.string(),
    action: z.string()
  })).optional(),
  edgeCases: z.array(z.object({
    scenario: z.string(),
    handling: z.string(),
    severity: z.enum(['critical', 'warning', 'info'])
  })).optional()
})

export const aiRoutes = new Hono()
  // 生成节点内容
  .post('/generate-node', authMiddleware, zValidator('json', GenerateNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateNodeContent(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 生成失败'
      return c.json({ error: message }, 500)
    }
  })

  // 边界条件建议
  .post('/suggest-edge-cases', authMiddleware, zValidator('json', SuggestEdgeCasesSchema), async (c) => {
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

  // 分析节点完整性
  .post('/analyze-node', authMiddleware, zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.analyzeNode(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 分析失败'
      return c.json({ error: message }, 500)
    }
  })

  // 生成测试用例
  .post('/generate-tests', authMiddleware, zValidator('json', AnalyzeNodeSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await aiService.generateTestCases(input)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试用例生成失败'
      return c.json({ error: message }, 500)
    }
  })