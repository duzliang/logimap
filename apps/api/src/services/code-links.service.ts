import { prisma } from '../db/prisma.js'
import { matchesCodePath, normalizeCodePath } from '@logimap/types'
import type { CodeLinkNode, CodeLinkResult } from '@logimap/types'

/**
 * 代码反向关联服务（T3-9）
 *
 * 给定文件路径（及可选行号），反查团队内引用了该文件的逻辑节点。
 * 与 codeRef（节点 → 代码）方向相反。
 */
export class CodeLinksService {
  async findNodesByPath(input: {
    teamId: string
    path: string
    line?: number
  }): Promise<CodeLinkResult> {
    const { teamId, path, line } = input

    // 用归一化后的文件名作为粗筛关键词，走 codeRef 的 trigram GIN 索引减少候选量。
    // 取文件名最后一段（最具区分度且必然出现在 codeRef 里）。
    const normalized = normalizeCodePath(path)
    const fileName = normalized.split('/').pop() || normalized

    const candidates = await prisma.logicNode.findMany({
      where: {
        codeRef: { not: null, contains: fileName, mode: 'insensitive' },
        module: { system: { teamId } }
      },
      select: {
        id: true,
        name: true,
        status: true,
        codeRef: true,
        module: {
          select: {
            id: true,
            name: true,
            system: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const nodes: CodeLinkNode[] = []
    for (const node of candidates) {
      if (!node.codeRef) continue
      const match = matchesCodePath(node.codeRef, { filePath: path, line })
      if (!match.matched) continue
      nodes.push({
        nodeId: node.id,
        nodeName: node.name,
        status: node.status,
        moduleId: node.module.id,
        moduleName: node.module.name,
        systemId: node.module.system.id,
        systemName: node.module.system.name,
        codeRef: node.codeRef,
        filePath: match.parsed.filePath,
        symbol: match.parsed.symbol,
        lineStart: match.parsed.lineStart,
        lineEnd: match.parsed.lineEnd,
        lineMatched: match.lineMatched
      })
    }

    return { path, line, count: nodes.length, nodes }
  }
}
