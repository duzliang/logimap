import { createInterface } from 'node:readline'
import { prisma } from '../db/prisma.js'
import { ApiTokenService } from '../services/api-token.service.js'
import { handleRpc, type JsonRpcRequest } from './dispatch.js'
import type { McpSession } from './tools.js'

/**
 * LogiMap MCP 服务端（T3-19）
 *
 * stdio 传输：换行分隔的 JSON-RPC 2.0。使用 API 令牌认证。
 *
 * 用法（在 MCP 客户端配置中）：
 *   command: "pnpm"
 *   args: ["--filter", "api", "mcp"]
 *   env: { LOGIMAP_API_TOKEN: "lmk_..." }
 */

async function resolveSession(): Promise<McpSession> {
  const token = process.env.LOGIMAP_API_TOKEN
  if (!token) {
    throw new Error('缺少环境变量 LOGIMAP_API_TOKEN')
  }
  const auth = await new ApiTokenService().verify(token)
  if (!auth) {
    throw new Error('LOGIMAP_API_TOKEN 无效或已过期')
  }
  const memberships = await prisma.teamMember.findMany({
    where: { userId: auth.userId },
    select: { teamId: true }
  })
  return {
    userId: auth.userId,
    email: auth.email,
    teamIds: memberships.map((m) => m.teamId)
  }
}

function writeMessage(message: unknown) {
  process.stdout.write(JSON.stringify(message) + '\n')
}

async function main() {
  const session = await resolveSession()
  // 诊断信息走 stderr，避免污染 stdout 的 JSON-RPC 流
  process.stderr.write(`[logimap-mcp] authenticated as ${session.email}, teams=${session.teamIds.length}\n`)

  const rl = createInterface({ input: process.stdin })
  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let request: JsonRpcRequest
    try {
      request = JSON.parse(trimmed) as JsonRpcRequest
    } catch {
      writeMessage({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
      continue
    }
    try {
      const response = await handleRpc(request, session)
      if (response) writeMessage(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'internal error'
      writeMessage({ jsonrpc: '2.0', id: request.id ?? null, error: { code: -32603, message } })
    }
  }
}

main().catch((error) => {
  process.stderr.write(`[logimap-mcp] fatal: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
