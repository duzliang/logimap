# CLAUDE.md — LogiMap 协作手册

> 本文件用于让 Claude 在每次会话开始时快速对齐项目上下文、流程与当前任务。

---

## 1. 项目概览

- **项目**：LogiMap —— AI 时代的业务逻辑可视化与治理平台
- **仓库**：`/Users/duzl/Github/logimap`
- **架构**：pnpm monorepo
  - `apps/web`：React 18 + Vite + TypeScript + Tailwind + `@logimap/ui`
  - `apps/api`：Hono + Prisma + PostgreSQL
  - `packages/types`：共享 Zod schema + TypeScript 类型
  - `packages/ui`：共享 shadcn/ui 组件
- **核心概念**：Team → System → Module → LogicNode → Connection
- **文档**：`DEVELOPMENT_PLAN.md`（路线图）、`SPEC.md`（产品规格）、`UI-SPEC.md`（视觉规范）

---

## 2. 当前开发进度

| 阶段 | 任务 | 状态 |
|------|------|------|
| Phase 1 (v0.2.0) | RBAC、团队管理、节点审批、版本历史/回滚 | ✅ 已提交 |
| Phase 2 (v0.3.0) | 通知系统（T3-13 ~ T3-16） | ✅ 已提交 |
| 全局搜索与筛选（T2-15 ~ T2-18） | 搜索索引、API、筛选器 UI、结果页、图谱高亮 | ✅ 已提交 |
| UI 规范落地（T2-19 ~ T2-22） | Modal/Sheet 遮罩、组件样式统一、AppShell 布局、暗色模式 | ✅ 已提交 |
| Phase 2 P1（v0.3.0 核心） | AI 能力升级 / 影响分析（T3-1 ~ T3-6 / T3-10 ~ T3-12） | ✅ 已提交 |
| Phase 2 P2 | codeRef 解析增强（T3-7）：共享解析器、可跳转代码链接、System 仓库配置 | ✅ 已提交 |
| Phase 2 P2 | OpenAPI 文档（T3-17）：/api/docs Swagger UI + /api/openapi.json | ✅ 已提交 |
| Phase 2 P2 | Git 仓库导入（T3-8）：目录树分析 → 系统/模块建议 → 一键导入 | ✅ 已提交 |
| Phase 2 P2 | API Token 管理（T3-18）：令牌创建/撤销、Bearer 认证集成 | ✅ 已提交 |
| Phase 2 P2 | MCP 服务接口（T3-19）：stdio JSON-RPC 图谱查询、API 令牌认证 | ✅ 已提交 |
| Phase 2 P2 | 图谱导出增强（T3-20）：PNG/SVG/PDF/Markdown | ✅ 已提交 |
| **下一步** | **Phase 2 P2 全部完成；可选项：T3-9 代码反向关联设计 / T3-16 邮件通知；或进入 Phase 3（v0.4.0）** | 🔄 待定 |

> 下次会话直接从此任务开始，无需重新确认。

---

## 3. 协作流程（Agent OS）

### 3.1 会话启动

Claude 应自动执行：

1. 读取 `.claude/memory/MEMORY.md` 和任务列表。
2. 查看最近 `git log` 和当前分支状态。
3. 直接呈现当前待办任务并询问是否开始，不再复述历史。

### 3.2 新功能执行流程

对于非 trivial 任务（新功能、多文件改动、架构决策），必须：

1. **Plan Mode**：先探索代码，再写计划，经用户批准后执行。
2. **Task 拆分**：用 `TaskCreate` 把任务拆成 3~7 个可验收子任务。
3. **数据层先行**：Prisma schema 变更优先，再并行前后端。
4. **原子提交**：每个子任务完成后单独 commit，使用 Conventional Commits。
5. **验证**：改完后跑测试和构建，不堆到末尾。

### 3.3 会话收尾

Claude 应自动执行：

1. 提交所有已完成改动（用户授权后）。
2. 更新 `.claude/memory/` 中的进度记忆。
3. 更新任务列表状态。
4. 明确写出「下次从哪个任务继续」。

---

## 4. 代码规范

### 4.1 提交信息

```
feat: 简短描述

可选正文：为什么、影响范围

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 4.2 后端规范

- 路由：`apps/api/src/routes/*.routes.ts`，使用 Hono 链式 API。
- 服务：`apps/api/src/services/*.service.ts`，业务逻辑写在 service 层。
- 校验：所有 Zod schema 放在 `packages/types/src/*.schemas.ts`；API 侧用 `apps/api/src/lib/validators.*.ts` 做薄层 re-export。
- 权限：使用 `requireTeamRole(minRole, teamResolvers.fromXxxParam)`。
- Prisma：schema 变更后必须 `pnpm prisma migrate dev` + `pnpm prisma generate`。

### 4.3 前端规范

- API 函数：`apps/web/src/api/*.api.ts`，使用 `apiClient`。
- 状态：服务端状态用 React Query；客户端全局状态用 Zustand（如 `auth.store.ts`）。
- UI 组件：优先使用 `@logimap/ui`；缺失时再评估是否新增到共享包。
- 路由：在 `apps/web/src/router.tsx` 注册。

---

## 5. 验证命令

```bash
# 类型检查 + 构建
pnpm --filter api build
pnpm --filter web build

# 测试
pnpm --filter api test
pnpm --filter web test

# 开发
pnpm dev
```

> 注意：当前根目录 `pnpm lint` 失败，因为 eslint 未在工作区安装。验证以 build + test 为准。

---

## 6. 测试策略

- 后端：service 单元测试 + route 集成测试（supertest + Hono app）。
- 前端：组件测试（Vitest + jsdom + React Testing Library）。
- 关键路径必须有测试：认证、权限、节点 CRUD、版本回滚、审批状态机。

---

## 7. 沟通偏好

- 用户使用中文，回复使用中文。
- 用户喜欢直接继续任务，不喜欢反复确认「从哪开始」。
- Bug 报告格式建议：操作步骤 + 预期 + 实际 + 环境（分支/commit）。
- 用户希望 AI 主动记录进度，下次直接接续。

---

## 8. 待决策/技术债

- [ ] 安装并配置 eslint + lint-staged + pre-commit hook
- [x] 补齐 DEVELOPMENT_PLAN.md 中已交付任务的勾选状态
- [ ] 评估是否引入 Redis 或 materialized view 用于通知未读计数（当前靠索引）
- [ ] Phase 2 后续任务优先级：代码关联深化（T3-7 ~ T3-9） → OpenAPI（T3-17） → MCP（T3-19） → 图谱导出增强（T3-20）

---

*最后更新：2026-07-08（Phase 2 P2 全部交付：T3-7 / T3-8 / T3-17 / T3-18 / T3-19 / T3-20）*
