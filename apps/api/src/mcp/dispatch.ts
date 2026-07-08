import { mcpTools, executeTool, McpToolError, type McpSession } from './tools.js'

/** MCP 服务信息 */
export const MCP_SERVER_INFO = { name: 'logimap-mcp', version: '1.0.0' }
export const MCP_PROTOCOL_VERSION = '2024-11-05'

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string }
}

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

function err(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

/**
 * 处理单条 JSON-RPC 请求。通知（无 id）返回 null。
 */
export async function handleRpc(
  request: JsonRpcRequest,
  session: McpSession
): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null
  const isNotification = request.id === undefined || request.id === null

  switch (request.method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: MCP_SERVER_INFO
      })

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null

    case 'ping':
      return ok(id, {})

    case 'tools/list':
      return ok(id, { tools: mcpTools })

    case 'tools/call': {
      const name = request.params?.name as string | undefined
      const args = (request.params?.arguments as Record<string, unknown>) ?? {}
      if (!name) {
        return err(id, -32602, '缺少工具名称')
      }
      try {
        const result = await executeTool(name, args, session)
        return ok(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '工具执行失败'
        // MCP 约定：工具级错误通过 isError 返回，而非协议错误
        if (error instanceof McpToolError) {
          return ok(id, {
            content: [{ type: 'text', text: message }],
            isError: true
          })
        }
        return err(id, -32603, message)
      }
    }

    default:
      if (isNotification) return null
      return err(id, -32601, `未知方法：${request.method}`)
  }
}
