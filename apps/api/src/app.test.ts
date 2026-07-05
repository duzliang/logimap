import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createServer } from 'http'
import { getRequestListener } from '@hono/node-server'
import { app } from './app'

const server = createServer(getRequestListener(app.fetch))

describe('Health Check', () => {
  it('should return ok status', async () => {
    const response = await request(server)
      .get('/health')
      .expect(200)

    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('API Info', () => {
  it('should return API metadata', async () => {
    const response = await request(server)
      .get('/api/v1')
      .expect(200)

    expect(response.body).toMatchObject({
      name: 'LogiMap API',
      version: '1.0.0',
      status: 'running'
    })
  })
})
