import { prisma } from '../db/prisma.js'
import type { AgentContextExportInput } from '@logimap/types'

export class AgentContextService {
  async generate(input: AgentContextExportInput): Promise<string> {
    const { scope, scopeId, format } = input
    let title = ''
    let systems: Array<{
      name: string
      description?: string | null
      modules: Array<{
        name: string
        description?: string | null
        logicNodes: Array<{ name: string; summary: string | null; codeRef: string | null; status: string }>
      }>
    }> = []

    if (scope === 'team') {
      const team = await prisma.team.findUnique({
        where: { id: scopeId },
        select: {
          name: true,
          description: true,
          systems: {
            orderBy: { name: 'asc' },
            select: {
              name: true,
              description: true,
              modules: {
                orderBy: { order: 'asc' },
                select: {
                  name: true,
                  description: true,
                  logicNodes: {
                    select: { name: true, summary: true, codeRef: true, status: true }
                  }
                }
              }
            }
          }
        }
      })

      if (!team) {
        throw new Error('团队不存在')
      }

      title = `Team: ${team.name}`
      systems = team.systems
    } else if (scope === 'system') {
      const system = await prisma.system.findUnique({
        where: { id: scopeId },
        select: {
          name: true,
          description: true,
          modules: {
            orderBy: { order: 'asc' },
            select: {
              name: true,
              description: true,
              logicNodes: {
                select: { name: true, summary: true, codeRef: true, status: true }
              }
            }
          }
        }
      })

      if (!system) {
        throw new Error('系统不存在')
      }

      title = `System: ${system.name}`
      systems = [system]
    } else if (scope === 'module') {
      const module = await prisma.module.findUnique({
        where: { id: scopeId },
        select: {
          name: true,
          description: true,
          system: { select: { name: true } },
          logicNodes: {
            select: { name: true, summary: true, codeRef: true, status: true }
          }
        }
      })

      if (!module) {
        throw new Error('模块不存在')
      }

      title = `System: ${module.system.name} / Module: ${module.name}`
      systems = [{ name: module.system.name, modules: [module] }]
    } else {
      throw new Error('不支持的导出范围')
    }

    if (format === 'cursorrules') {
      return this.toCursorRules(title, systems)
    }

    return this.toAgentsMd(title, systems)
  }

  private toCursorRules(
    title: string,
    systems: Array<{
      name: string
      description?: string | null
      modules: Array<{
        name: string
        description?: string | null
        logicNodes: Array<{ name: string; summary: string | null; codeRef: string | null; status: string }>
      }>
    }>
  ): string {
    const lines = [
      '# LogiMap Agent Context',
      '',
      `> ${title}`,
      '',
      '## Domain Overview',
      'This project uses LogiMap to manage business logic as a graph of systems, modules, and logic nodes.',
      'When writing or reviewing code, keep the following domain facts in mind.',
      ''
    ]

    for (const system of systems) {
      lines.push(`### System: ${system.name}`)
      if (system.description) {
        lines.push(system.description)
      }
      lines.push('')

      for (const module of system.modules) {
        lines.push(`#### Module: ${module.name}`)
        if (module.description) {
          lines.push(module.description)
        }
        lines.push('')

        if (module.logicNodes.length > 0) {
          lines.push('**Logic Nodes:**')
          for (const node of module.logicNodes) {
            const parts = [`- ${node.name}`]
            if (node.summary) parts.push(`- ${node.summary}`)
            if (node.codeRef) parts.push(`  - codeRef: \`${node.codeRef}\``)
            if (node.status) parts.push(`  - status: ${node.status}`)
            lines.push(parts.join('\n'))
          }
          lines.push('')
        }
      }
    }

    lines.push('## Coding Conventions')
    lines.push('- Prefer function/class names that clearly match the corresponding logic node name.')
    lines.push('- Keep the `codeRef` field on logic nodes synchronized with actual file paths and symbols.')
    lines.push('- Before changing behavior, review upstream and downstream impact via impact analysis.')
    lines.push('')

    return lines.join('\n')
  }

  private toAgentsMd(
    title: string,
    systems: Array<{
      name: string
      description?: string | null
      modules: Array<{
        name: string
        description?: string | null
        logicNodes: Array<{ name: string; summary: string | null; codeRef: string | null; status: string }>
      }>
    }>
  ): string {
    const lines = ['# Agents', '', `## Domain Context — ${title}`, '']

    for (const system of systems) {
      lines.push(`### ${system.name}`)
      if (system.description) {
        lines.push(system.description)
        lines.push('')
      }

      for (const module of system.modules) {
        lines.push(`#### ${module.name}`)
        if (module.description) {
          lines.push(module.description)
          lines.push('')
        }

        for (const node of module.logicNodes) {
          lines.push(`- **${node.name}**${node.summary ? `: ${node.summary}` : ''}`)
          if (node.codeRef) {
            lines.push(`  - Code: \`${node.codeRef}\``)
          }
        }
        if (module.logicNodes.length > 0) {
          lines.push('')
        }
      }
    }

    lines.push('## Agent Instructions')
    lines.push('')
    lines.push('When implementing or refactoring code in this codebase:')
    lines.push('')
    lines.push('1. Check LogiMap for the logic node that describes the feature.')
    lines.push('2. Ensure the implementation matches the trigger, dependencies, main flow, and branches.')
    lines.push('3. Update `codeRef` if files or symbols move.')
    lines.push('4. Run impact analysis before modifying widely referenced nodes.')
    lines.push('')

    return lines.join('\n')
  }
}
