import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createServer } from 'http'
import { getRequestListener } from '@hono/node-server'
import { app } from '../app.js'
import { signToken } from '../lib/jwt.js'
import {
  createUser,
  createTeam,
  addTeamMember,
  createSystem,
  createModule,
  createLogicNode,
  cleanupSearchTestData
} from '../test/factories.js'

const server = createServer(getRequestListener(app.fetch))

describe('GET /api/v1/search', () => {
  beforeEach(async () => {
    await cleanupSearchTestData()
  })

  afterEach(async () => {
    await cleanupSearchTestData()
  })

  async function authHeader(role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER') {
    const user = await createUser()
    const team = await createTeam()
    await addTeamMember(user.id, team.id, role)
    const system = await createSystem(team.id, { name: 'Route Test System' })
    const moduleA = await createModule(system.id, { name: 'Route Test Module' })
    const node = await createLogicNode(moduleA.id, user.id, {
      name: 'Route Test Node',
      summary: 'A node for route tests',
      status: 'APPROVED',
      priority: 'NORMAL',
      tags: ['route']
    })
    const token = await signToken({ userId: user.id, email: user.email })
    return { token, teamId: team.id, systemId: system.id, moduleId: moduleA.id, nodeId: node.id }
  }

  it('returns 401 without authorization', async () => {
    const response = await request(server).get('/api/v1/search').expect(401)
    expect(response.body.code).toBe('UNAUTHORIZED')
  })

  it('returns grouped search results', async () => {
    const { token, teamId } = await authHeader()

    const response = await request(server)
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ teamId, q: 'Route Test' })
      .expect(200)

    expect(response.body.data.systems.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.data.modules.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.data.nodes.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.data.nodes.items[0].type).toBe('node')
  })

  it('filters nodes by status and priority', async () => {
    const { token, teamId } = await authHeader()

    const response = await request(server)
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ teamId, type: 'node', statuses: 'APPROVED', priorities: 'NORMAL' })
      .expect(200)

    expect(response.body.data.nodes.items).toHaveLength(1)
    expect(response.body.data.nodes.items[0].status).toBe('APPROVED')
    expect(response.body.data.nodes.items[0].priority).toBe('NORMAL')
  })

  it('returns 400 for invalid query params', async () => {
    const { token, teamId } = await authHeader()

    const response = await request(server)
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ teamId, limit: 'not-a-number' })
      .expect(400)

    expect(response.body.success).toBe(false)
  })

  it('returns 403 for non-team members', async () => {
    const outsider = await createUser({ email: 'search-test-outsider@example.com' })
    const token = await signToken({ userId: outsider.id, email: outsider.email })
    const someTeam = await createTeam()

    const response = await request(server)
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${token}`)
      .query({ teamId: someTeam.id })
      .expect(403)

    expect(response.body.code).toBe('FORBIDDEN')
  })
})
