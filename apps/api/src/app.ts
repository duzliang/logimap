import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { authRoutes } from './routes/auth.routes.js'
import { systemsRoutes } from './routes/systems.routes.js'
import { modulesRoutes, moduleDetailRoutes } from './routes/modules.routes.js'
import { logicNodesRoutes } from './routes/logic-nodes.routes.js'
import { graphRoutes } from './routes/graph.routes.js'
import { aiRoutes } from './routes/ai.routes.js'
import { teamsRoutes } from './routes/teams.routes.js'
import { nodeDetailRoutes } from './routes/nodes.routes.js'
import { notificationsRoutes } from './routes/notifications.routes.js'
import { authMiddleware } from './middleware/auth.middleware.js'
import { ModulesService } from './services/modules.service.js'
import { requireTeamRole, teamResolvers } from './middleware/rbac.middleware.js'

const modulesService = new ModulesService()

export const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
    // 开发环境允许 localhost
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev && origin && (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    )) {
      return origin
    }
    if (origin && allowedOrigins.includes(origin)) {
      return origin
    }
    return null
  },
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

// Public routes
app.route('/api/v1/auth', authRoutes)

// Protected routes
app.use('/api/v1/*', authMiddleware)

app.route('/api/v1/systems', systemsRoutes)
app.route('/api/v1/systems/:systemId/modules', modulesRoutes)
app.route('/api/v1/modules/:moduleId', moduleDetailRoutes)
app.route('/api/v1/modules/:moduleId/nodes', logicNodesRoutes)
app.route('/api/v1/modules/:moduleId/graph', graphRoutes)
app.route('/api/v1/nodes/:nodeId', nodeDetailRoutes)
app.route('/api/v1/ai', aiRoutes)
app.route('/api/v1/teams', teamsRoutes)
app.route('/api/v1/notifications', notificationsRoutes)
