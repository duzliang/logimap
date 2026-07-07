import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  AnalyzeImpactSchema,
  WhatIfImpactSchema,
  CreateImpactReportSchema,
  ListImpactReportsSchema
} from '@logimap/types'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireTeamRole, teamResolvers } from '../middleware/rbac.middleware.js'
import { ImpactAnalysisService } from '../services/impact-analysis.service.js'
import { ImpactReportService } from '../services/impact-report.service.js'

const impactAnalysis = new ImpactAnalysisService()
const impactReport = new ImpactReportService()

export const impactRoutes = new Hono()
  .use('*', authMiddleware)
  .post('/analyze', requireTeamRole('VIEWER', teamResolvers.fromNodeBody), zValidator('json', AnalyzeImpactSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await impactAnalysis.analyzeImpact(input.nodeId, input.direction, input.maxDepth)
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '影响分析失败'
      return c.json({ error: message, code: 'IMPACT_ANALYSIS_FAILED' }, 500)
    }
  })
  .post('/what-if', requireTeamRole('MEMBER', teamResolvers.fromNodeBody), zValidator('json', WhatIfImpactSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const result = await impactAnalysis.whatIfImpact(
        input.nodeId,
        {
          addConnections: input.addConnections,
          removeConnectionIds: input.removeConnectionIds
        },
        input.direction,
        input.maxDepth
      )
      return c.json({ data: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '假设分析失败'
      return c.json({ error: message, code: 'WHAT_IF_ANALYSIS_FAILED' }, 500)
    }
  })
  .post('/reports', requireTeamRole('MEMBER', teamResolvers.fromNodeBody), zValidator('json', CreateImpactReportSchema), async (c) => {
    try {
      const input = c.req.valid('json')
      const user = c.get('user')
      const scope = await impactAnalysis.analyzeImpact(input.nodeId, input.direction, input.maxDepth)
      const report = await impactReport.saveReport(
        {
          nodeId: input.nodeId,
          moduleId: input.moduleId,
          title: input.title,
          direction: input.direction,
          maxDepth: input.maxDepth,
          scope
        },
        user?.userId
      )
      return c.json({ data: report })
    } catch (error) {
      const message = error instanceof Error ? error.message : '报告生成失败'
      return c.json({ error: message, code: 'REPORT_GENERATION_FAILED' }, 500)
    }
  })
  .get('/reports', requireTeamRole('VIEWER', teamResolvers.fromModuleQuery), zValidator('query', ListImpactReportsSchema), async (c) => {
    try {
      const input = c.req.valid('query')
      const reports = await impactReport.listReports({
        nodeId: input.nodeId,
        moduleId: input.moduleId
      })
      return c.json({ data: reports })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取报告列表失败'
      return c.json({ error: message, code: 'LIST_REPORTS_FAILED' }, 500)
    }
  })
  .get('/reports/:reportId', requireTeamRole('VIEWER', teamResolvers.fromReportParam), async (c) => {
    try {
      const reportId = c.req.param('reportId')
      const report = await impactReport.getReport(reportId)
      if (!report) {
        return c.json({ error: '报告不存在', code: 'REPORT_NOT_FOUND' }, 404)
      }
      return c.json({ data: report })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取报告失败'
      return c.json({ error: message, code: 'GET_REPORT_FAILED' }, 500)
    }
  })
