import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import type { CreateModuleInput, UpdateModuleInput } from '../lib/validators.system.js'

export class ModulesService {
  async getAll(systemId: string) {
    const modules = await prisma.module.findMany({
      where: { systemId },
      include: {
        _count: {
          select: { logicNodes: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return modules.map((m) => ({
      ...m,
      nodesCount: m._count.logicNodes,
      _count: undefined
    }))
  }

  async getById(moduleId: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        _count: {
          select: { logicNodes: true }
        }
      }
    })

    if (!module) {
      throw new Error('模块不存在')
    }

    return {
      ...module,
      nodesCount: module._count.logicNodes,
      _count: undefined
    }
  }

  async create(systemId: string, input: CreateModuleInput) {
    // 检查 slug 是否已存在
    const existing = await prisma.module.findFirst({
      where: { systemId, slug: input.slug }
    })

    if (existing) {
      throw new Error('模块标识已存在')
    }

    const module = await prisma.module.create({
      data: {
        id: generateId(),
        systemId,
        ...input
      }
    })

    return module
  }

  async update(moduleId: string, input: UpdateModuleInput) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      throw new Error('模块不存在')
    }

    // 如果更新 slug，检查是否与其他模块冲突
    if (input.slug) {
      const existing = await prisma.module.findFirst({
        where: { systemId: module.systemId, slug: input.slug, id: { not: moduleId } }
      })

      if (existing) {
        throw new Error('模块标识已存在')
      }
    }

    return prisma.module.update({
      where: { id: moduleId },
      data: input
    })
  }

  async delete(moduleId: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!module) {
      throw new Error('模块不存在')
    }

    await prisma.module.delete({
      where: { id: moduleId }
    })
  }
}
