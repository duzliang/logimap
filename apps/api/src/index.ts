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
app.route('/api/v1/modules/:moduleId/nodes', logicNodesRoutes)
app.route('/api/v1/modules/:moduleId/graph', graphRoutes)
app.route('/api/v1/nodes', logicNodesRoutes)
app.route('/api/v1/nodes/:nodeId', logicNodesRoutes)
app.route('/api/v1/graph', graphRoutes)

// Start server
const port = Number(process.env.PORT) || 3001

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Server running at http://localhost:${port}`)
