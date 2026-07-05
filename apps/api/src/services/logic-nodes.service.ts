import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { generateId } from '../lib/id-generator.js'
import { getNextStatus } from '../lib/approval-state-machine.js'
import { diffNodes } from '../lib/node-diff.js'
import { hasRole } from '../lib/rbac.js'
import { NotificationsService } from './notifications.service.js'
import {
  buildNodeStatusNotification,
  buildReviewApprovedNotification,
  buildReviewRejectedNotification,
  buildNodeDeprecatedNotification,
  buildMentionNotification,
  extractMentionedNames
} from '../lib/notifications.js'
import type { CreateLogicNodeInput, UpdateLogicNodeInput, UpdatePositionInput } from '../lib/validators.logic-node.js'
import type { Branch, EdgeCase, LogicNodeStatus, NodePriority, ApprovalAction, TeamRole } from '@logimap/types'

const notifications = new NotificationsService()

type PrismaNode = Awaited<ReturnType<typeof prisma.logicNode.findUnique>>

function toNodeDto(node: PrismaNode) {
  if (!node) return null
  return {
    ...node,
    branches: node.branches as Branch[],
    edgeCases: node.edgeCases as EdgeCase[]
  }
}

function snapshotOf(node: PrismaNode): Prisma.InputJsonValue {
  if (!node) return {}
  return {
    ...node,
    branches: node.branches,
    edgeCases: node.edgeCases
  } as Prisma.InputJsonValue
}

export class LogicNodesService {
  async getAll(moduleId: string) {
    const nodes = await prisma.logicNode.findMany({
      where: { moduleId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        updatedBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return nodes.map((node) => toNodeDto(node)!)
  }

  async getById(nodeId: string) {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        updatedBy: {
          select: { id: true, name: true, email: true }
        },
        module: {
          select: { id: true, name: true, system: { select: { id: true, name: true } } }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10
        }
      }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    return toNodeDto(node)!
  }

  async create(moduleId: string, input: CreateLogicNodeInput, userId: string) {
    const node = await prisma.logicNode.create({
      data: {
        id: generateId(),
        moduleId,
        createdById: userId,
        ...input,
        branches: input.branches as Prisma.InputJsonValue,
        edgeCases: input.edgeCases as Prisma.InputJsonValue
      },
      include: {
        module: {
          select: { id: true, name: true }
        }
      }
    })

    return toNodeDto(node)!
  }

  async update(nodeId: string, input: UpdateLogicNodeInput, userId: string, actorRole?: TeamRole) {
    const existingNode = await prisma.logicNode.findUnique({
      where: { id: nodeId }
    })

    if (!existingNode) {
      throw new Error('节点不存在')
    }

    if (existingNode.status === 'APPROVED') {
      throw new Error('已确认的节点不能编辑内容，请先撤销确认')
    }

    if (existingNode.status === 'DEPRECATED' && actorRole && !hasRole(actorRole, 'ADMIN')) {
      throw new Error('已废弃的节点仅管理员可编辑')
    }

    // 仅当内容真正变化时才创建版本快照
    const changedFields = diffNodes(
      existingNode as unknown as Record<string, unknown>,
      { ...existingNode, ...input } as Record<string, unknown>
    ).filter((d) => d.kind !== 'unchanged')

    const node = await prisma.$transaction(async (tx) => {
      if (changedFields.length > 0) {
        await tx.logicNodeVersion.create({
          data: {
            id: generateId(),
            nodeId,
            version: await this.getNextVersion(nodeId, tx),
            snapshot: snapshotOf(existingNode),
            changeNote: input.name ? `更新节点：${existingNode.name}` : undefined,
            createdById: userId
          }
        })
      }

      const updateData: Prisma.LogicNodeUpdateInput = { ...input }
      if (input.branches !== undefined) updateData.branches = input.branches as Prisma.InputJsonValue
      if (input.edgeCases !== undefined) updateData.edgeCases = input.edgeCases as Prisma.InputJsonValue
      updateData.updatedBy = { connect: { id: userId } }

      const node = await tx.logicNode.update({
        where: { id: nodeId },
        data: updateData,
        include: {
          module: {
            select: { id: true, name: true, system: { select: { teamId: true } } }
          }
        }
      })

      return node
    })

    // 在事务外异步创建 @提及 通知，不影响主流程
    const mentionText = [input.notes, input.mainFlow].filter(Boolean).join(' ')
    if (mentionText) {
      const mentionedNames = extractMentionedNames(mentionText)
      if (mentionedNames.length > 0) {
        this.createMentionNotifications(userId, node, mentionedNames).catch((err) => {
          console.error('创建提及通知失败', err)
        })
      }
    }

    return toNodeDto(node)!
  }

  async approve(
    nodeId: string,
    userId: string,
    action: ApprovalAction,
    role: TeamRole,
    comment?: string
  ) {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId },
      include: {
        module: {
          select: {
            system: {
              select: { teamId: true }
            }
          }
        }
      }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    const toStatus = getNextStatus(node.status, action, role)

    const updatedNode = await prisma.$transaction(async (tx) => {
      await tx.approvalRecord.create({
        data: {
          id: generateId(),
          nodeId,
          reviewerId: userId,
          fromStatus: node.status,
          toStatus,
          action,
          comment
        }
      })

      return await tx.logicNode.update({
        where: { id: nodeId },
        data: {
          status: toStatus,
          updatedById: userId
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
          module: { select: { id: true, name: true, system: { select: { teamId: true } } } }
        }
      })
    })

    // 在事务外异步创建审批通知
    this.createApprovalNotifications(userId, updatedNode, toStatus, action, comment, node.status).catch((err) => {
      console.error('创建审批通知失败', err)
    })

    return toNodeDto(updatedNode)!
  }

  async updatePosition(nodeId: string, input: UpdatePositionInput) {
    const node = await prisma.logicNode.update({
      where: { id: nodeId },
      data: {
        positionX: input.positionX,
        positionY: input.positionY
      }
    })

    return node
  }

  async delete(nodeId: string) {
    const node = await prisma.logicNode.findUnique({
      where: { id: nodeId }
    })

    if (!node) {
      throw new Error('节点不存在')
    }

    await prisma.logicNode.delete({
      where: { id: nodeId }
    })
  }

  async getVersions(nodeId: string) {
    const versions = await prisma.logicNodeVersion.findMany({
      where: { nodeId },
      orderBy: { version: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    })

    return versions
  }

  async getVersionDiff(nodeId: string, version: number, compareToVersion?: number) {
    const targetVersion = await prisma.logicNodeVersion.findUnique({
      where: {
        nodeId_version: {
          nodeId,
          version
        }
      }
    })

    if (!targetVersion) {
      throw new Error('目标版本不存在')
    }

    const targetSnapshot = targetVersion.snapshot as Record<string, unknown>

    let baseSnapshot: Record<string, unknown>

    if (compareToVersion) {
      const baseVersion = await prisma.logicNodeVersion.findUnique({
        where: {
          nodeId_version: {
            nodeId,
            version: compareToVersion
          }
        }
      })

      if (!baseVersion) {
        throw new Error('对比版本不存在')
      }

      baseSnapshot = baseVersion.snapshot as Record<string, unknown>
    } else {
      const currentNode = await prisma.logicNode.findUnique({
        where: { id: nodeId }
      })

      if (!currentNode) {
        throw new Error('节点不存在')
      }

      baseSnapshot = currentNode as unknown as Record<string, unknown>
    }

    return diffNodes(baseSnapshot, targetSnapshot)
  }

  async restoreVersion(nodeId: string, version: number, userId?: string) {
    const versionData = await prisma.logicNodeVersion.findUnique({
      where: {
        nodeId_version: {
          nodeId,
          version
        }
      }
    })

    if (!versionData) {
      throw new Error('版本不存在')
    }

    const snapshot = versionData.snapshot as Record<string, unknown>

    const node = await prisma.$transaction(async (tx) => {
      const existingNode = await tx.logicNode.findUnique({
        where: { id: nodeId }
      })

      if (existingNode) {
        await tx.logicNodeVersion.create({
          data: {
            id: generateId(),
            nodeId,
            version: await this.getNextVersion(nodeId, tx),
            snapshot: snapshotOf(existingNode),
            changeNote: `恢复版本前的快照`,
            createdById: userId
          }
        })
      }

      return await tx.logicNode.update({
        where: { id: nodeId },
        data: {
          name: snapshot.name as string,
          summary: snapshot.summary as string | null | undefined,
          status: snapshot.status as LogicNodeStatus,
          priority: snapshot.priority as NodePriority,
          trigger: snapshot.trigger as string | null | undefined,
          dependsOn: snapshot.dependsOn as string | null | undefined,
          mainFlow: snapshot.mainFlow as string | null | undefined,
          branches: snapshot.branches as Prisma.InputJsonValue,
          edgeCases: snapshot.edgeCases as Prisma.InputJsonValue,
          codeRef: snapshot.codeRef as string | null | undefined,
          tags: snapshot.tags as string[],
          notes: snapshot.notes as string | null | undefined,
          positionX: snapshot.positionX as number,
          positionY: snapshot.positionY as number,
          updatedById: userId
        }
      })
    })

    return toNodeDto(node)!
  }

  private async createMentionNotifications(
    actorId: string,
    node: {
      id: string
      name: string
      moduleId: string
      module: { system: { teamId: string } }
    },
    mentionedNames: string[]
  ) {
    const uniqueNames = Array.from(new Set(mentionedNames))
    const mentionedUsers = await prisma.user.findMany({
      where: { name: { in: uniqueNames } },
      select: { id: true, name: true }
    })

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, name: true }
    })

    const teamId = node.module.system.teamId

    for (const user of mentionedUsers) {
      if (user.id === actorId) continue
      await notifications.createNotification(
        buildMentionNotification({
          userId: user.id,
          actorId,
          node,
          teamId,
          actorName: actor?.name || undefined
        })
      )
    }
  }

  private async createApprovalNotifications(
    actorId: string,
    node: {
      id: string
      name: string
      status: string
      moduleId: string
      module: { system: { teamId: string } }
      createdBy: { id: string; name: string | null; email: string } | null
      updatedBy: { id: string; name: string | null; email: string } | null
    },
    toStatus: string,
    action: ApprovalAction,
    comment?: string,
    fromStatus?: string
  ) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, name: true }
    })

    const teamId = node.module.system.teamId
    const actorName = actor?.name || undefined

    const recipientIds = new Set<string>()
    if (node.createdBy && node.createdBy.id !== actorId) recipientIds.add(node.createdBy.id)
    if (node.updatedBy && node.updatedBy.id !== actorId) recipientIds.add(node.updatedBy.id)

    for (const userId of recipientIds) {
      let input
      if (action === 'APPROVE') {
        input = buildReviewApprovedNotification({ userId, actorId, node, teamId, actorName })
      } else if (action === 'REJECT') {
        input = buildReviewRejectedNotification({ userId, actorId, node, teamId, actorName, comment })
      } else if (action === 'DEPRECATE') {
        input = buildNodeDeprecatedNotification({ userId, actorId, node, teamId, actorName })
      } else {
        input = buildNodeStatusNotification({
          userId,
          actorId,
          node,
          teamId,
          fromStatus: fromStatus || node.status,
          toStatus,
          actorName
        })
      }

      await notifications.createNotification(input)
    }
  }

  private async getNextVersion(nodeId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prismaClient = tx || prisma
    const result = await prismaClient.logicNodeVersion.aggregate({
      where: { nodeId },
      _max: { version: true }
    })

    return (result._max.version || 0) + 1
  }
}
