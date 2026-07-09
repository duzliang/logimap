import { z } from 'zod'

/**
 * 代码反向关联（T3-9）
 *
 * 与 codeRef（节点 → 代码）方向相反：给定代码文件路径（及可选行号），
 * 反查团队内引用了该文件的逻辑节点。供代码编辑器插件 / MCP 使用。
 */

export const CodeLinkQuerySchema = z.object({
  teamId: z.string().min(1, '缺少团队 ID'),
  /** 目标文件路径（仓库相对或绝对均可） */
  path: z.string().min(1, '请输入文件路径'),
  /** 可选行号，用于按节点声明的行号区间进一步过滤 */
  line: z.coerce.number().int().positive().optional()
})

export type CodeLinkQuery = z.infer<typeof CodeLinkQuerySchema>

export interface CodeLinkNode {
  nodeId: string
  nodeName: string
  status: string
  moduleId: string
  moduleName: string
  systemId: string
  systemName: string
  /** 节点原始 codeRef */
  codeRef: string
  /** 解析出的文件路径 */
  filePath: string
  /** 关联的符号（如有） */
  symbol: string
  lineStart?: number
  lineEnd?: number
  /** 是否命中到了行号级别 */
  lineMatched: boolean
}

export interface CodeLinkResult {
  path: string
  line?: number
  count: number
  nodes: CodeLinkNode[]
}
