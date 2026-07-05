import { serve } from '@hono/node-server'
import { app } from './app.js'

// Start server
const port = Number(process.env.PORT) || 3001

serve({
  fetch: app.fetch,
  port,
})

console.log(`🚀 Server running at http://localhost:${port}`)
