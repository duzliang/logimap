import type { UserContext } from '../middleware/auth.middleware.js'
import type { TeamRole } from '@logimap/types'

declare module 'hono' {
  interface ContextVariableMap {
    user: UserContext
    teamId: string
    role: TeamRole
  }
}

export type {}
