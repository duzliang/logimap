import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '../db/prisma.js'
import { createUser } from '../test/factories.js'
import { ApiTokenService, hashToken, isApiToken } from './api-token.service.js'

const service = new ApiTokenService()
const createdUserIds: string[] = []

afterAll(async () => {
  await prisma.apiToken.deleteMany({ where: { userId: { in: createdUserIds } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
})

describe('ApiTokenService', () => {
  it('创建令牌返回一次性明文，且只存哈希', async () => {
    const user = await createUser()
    createdUserIds.push(user.id)

    const created = await service.create(user.id, { name: 'CI token' })
    expect(created.token.startsWith('lmk_')).toBe(true)
    expect(created.prefix).toBe(created.token.slice(0, 12))

    const row = await prisma.apiToken.findUnique({ where: { id: created.id } })
    expect(row?.tokenHash).toBe(hashToken(created.token))
    expect(row?.tokenHash).not.toContain(created.token)
  })

  it('verify 校验有效令牌并识别前缀', async () => {
    const user = await createUser()
    createdUserIds.push(user.id)
    const created = await service.create(user.id, { name: 't' })

    expect(isApiToken(created.token)).toBe(true)
    expect(isApiToken('eyJhbGc.jwt.token')).toBe(false)

    const result = await service.verify(created.token)
    expect(result).toMatchObject({ userId: user.id, email: user.email })

    expect(await service.verify('lmk_deadbeef')).toBeNull()
  })

  it('撤销后 verify 返回 null', async () => {
    const user = await createUser()
    createdUserIds.push(user.id)
    const created = await service.create(user.id, { name: 't' })

    await service.revoke(user.id, created.id)
    expect(await service.verify(created.token)).toBeNull()

    const list = await service.list(user.id)
    expect(list.find((t) => t.id === created.id)?.revokedAt).not.toBeNull()
  })

  it('过期令牌 verify 返回 null', async () => {
    const user = await createUser()
    createdUserIds.push(user.id)
    const created = await service.create(user.id, { name: 't', expiresInDays: 1 })
    await prisma.apiToken.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 1000) }
    })
    expect(await service.verify(created.token)).toBeNull()
  })
})
