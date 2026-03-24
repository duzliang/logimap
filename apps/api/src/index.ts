import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { serve } from '@hono/node-server'
import { authRoutes } from './routes/auth.routes.js'
import { systemsRoutes } from './routes/systems.routes.js'
import { modulesRoutes } from './routes/modules.routes.js'
import { logicNodesRoutes } from './routes/logic-nodes.routes.js'
import { graphRoutes } from './routes/graph.routes.js'
import { aiRoutes } from './routes/ai.routes.js'
import { authMiddleware } from './middleware/auth.middleware.js'
import { ModulesService } from './services/modules.service.js'

const modulesService = new ModulesService()

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// API v1 routes
app.get('/api/v1', (c) => {
  return c.json({
    name: 'LogiMap API',
    version: '1.0.0',
    status: 'running'
  })
})

// Register routes
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/systems', systemsRoutes)
app.route('/api/v1/systems/:systemId/modules', modulesRoutes)

// 独立的模块详情路由
app.get('/api/v1/modules/:moduleId', authMiddleware, async (c) => {
  try {
    const moduleId = c.req.param('moduleId')
    if (!moduleId) {
      return c.json({ error: '缺少模块 ID', code: 'MISSING_MODULE_ID' }, 400)
    }
    const result = await modulesService.getById(moduleId)
    return c.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取模块详情失败'
    return c.json({ error: message, code: 'GET_MODULE_FAILED' }, 404)
  }
})

app.route('/api/v1/modules/:moduleId/nodes', logicNodesRoutes)
app.route('/api/v1/modules/:moduleId/graph', graphRoutes)
app.route('/api/v1/nodes', logicNodesRoutes)
app.route('/api/v1/nodes/:nodeId', logicNodesRoutes)
app.route('/api/v1/graph', graphRoutes)
app.route('/api/v1/ai', aiRoutes)

// Start server
const port = Number(process.env.PORT) || 3001

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Server running at http://localhost:${port}`)
