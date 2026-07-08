import type { Hono } from 'hono'
import type { ZodTypeAny } from 'zod'
import { openAPIRouteHandler } from 'hono-openapi'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { Scalar } from '@scalar/hono-api-reference'

/**
 * 将 zod schema 转成可直接内联进 describeRoute 的 OpenAPI schema。
 * 用 zod-to-json-schema 生成内联 JSON Schema（不使用 $ref），
 * 便于放入 requestBody/response 的 content.schema 字段。
 * cast 收敛类型是因为 OpenAPI schema 字段类型较严格，避免各路由重复处理。
 */
export function docSchema(schema: ZodTypeAny) {
  return zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' }) as { $ref: string }
}

/**
 * T3-17：挂载 OpenAPI 文档。
 *
 * - GET /api/openapi.json —— 由 hono-openapi 从已注册路由自动生成的 OpenAPI 3.1 规范，
 *   `includeEmptyPaths` 保证即使未逐一注解的端点也会出现在文档中（以路由为单一事实来源，避免漂移）。
 * - GET /api/docs        —— Scalar 交互式文档 UI。
 *
 * 两个端点都在 authMiddleware 之外注册，因此可免鉴权访问。
 */
export function mountOpenApi(app: Hono) {
  app.get(
    '/api/openapi.json',
    openAPIRouteHandler(app, {
      includeEmptyPaths: true,
      documentation: {
        openapi: '3.1.0',
        info: {
          title: 'LogiMap API',
          version: '1.0.0',
          description:
            'LogiMap —— AI 时代的业务逻辑可视化与治理平台的 REST API。\n\n除 `/api/v1/auth/*` 与文档端点外，所有 `/api/v1/*` 端点均需在 `Authorization` 头携带 Bearer JWT。',
        },
        servers: [{ url: '/', description: '当前服务' }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: '登录后获得的 JWT，形如 `Authorization: Bearer <token>`',
            },
          },
        },
        security: [{ bearerAuth: [] }],
        tags: [
          { name: 'Auth', description: '认证：注册 / 登录 / 当前用户' },
          { name: 'Systems', description: '业务系统（含代码仓库配置）' },
          { name: 'Modules', description: '模块' },
          { name: 'LogicNodes', description: '逻辑节点 CRUD、审批、版本' },
          { name: 'Graph', description: '图谱与连接' },
          { name: 'AI', description: 'AI 生成 / 分析 / 一致性检查 / 自然语言查询' },
          { name: 'Teams', description: '团队、成员与邀请' },
          { name: 'Notifications', description: '站内通知' },
          { name: 'Search', description: '全局搜索' },
          { name: 'Impact', description: '影响分析与报告' },
        ],
      },
    })
  )

  app.get(
    '/api/docs',
    Scalar({
      url: '/api/openapi.json',
      pageTitle: 'LogiMap API 文档',
    })
  )
}
