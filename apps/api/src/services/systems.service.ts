import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import type { CreateSystemInput, UpdateSystemInput } from '../lib/validators.system.js'

export class SystemsService {
  async getAll(teamId: string) {
    const systems = await prisma.system.findMany({
      where: { teamId },
      include: {
        _count: {
          select: { modules: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return systems.map((s) => ({
      ...s,
      modulesCount: s._count.modules,
      _count: undefined
    }))
  }

  async getById(systemId: string, teamId: string) {
    const system = await prisma.system.findFirst({
      where: { id: systemId, teamId },
      include: {
        _count: {
          select: { modules: true }
        }
      }
    })

    if (!system) {
      throw new Error('系统不存在')
    }

    return {
      ...system,
      modulesCount: system._count.modules,
      _count: undefined
    }
  }

  async create(teamId: string, input: CreateSystemInput) {
    // 检查 slug 是否已存在
    const existing = await prisma.system.findFirst({
      where: { teamId, slug: input.slug }
    })

    if (existing) {
      throw new Error('系统标识已存在')
    }

    const system = await prisma.system.create({
      data: {
        id: generateId(),
        teamId,
        ...input
      }
    })

    return system
  }

  async update(systemId: string, teamId: string, input: UpdateSystemInput) {
    const system = await prisma.system.findFirst({
      where: { id: systemId, teamId }
    })

    if (!system) {
      throw new Error('系统不存在')
    }

    // 如果更新 slug，检查是否与其他系统冲突
    if (input.slug) {
      const existing = await prisma.system.findFirst({
        where: { teamId, slug: input.slug, id: { not: systemId } }
      })

      if (existing) {
        throw new Error('系统标识已存在')
      }
    }

    return prisma.system.update({
      where: { id: systemId },
      data: input
    })
  }

  async delete(systemId: string, teamId: string) {
    const system = await prisma.system.findFirst({
      where: { id: systemId, teamId }
    })

    if (!system) {
      throw new Error('系统不存在')
    }

    await prisma.system.delete({
      where: { id: systemId }
    })
  }
}
