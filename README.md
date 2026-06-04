<div align="center">

# 🧠 LogiMap

**面向研发团队的业务逻辑可视化与管理平台**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-orange?logo=hono)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

[English](#english) · [中文](#中文)

</div>

---

<a name="中文"></a>

## 📖 项目简介

LogiMap 是一款专为研发团队设计的**业务逻辑管理工具**，通过**可视化交互图谱**帮助团队将分散的业务知识沉淀为结构化的逻辑资产。

在复杂业务系统中，逻辑往往散落在代码注释、文档、甚至人脑中。LogiMap 提供了一套从「梳理 → 可视化 → 评审 → 沉淀」的完整工作流，让每个业务逻辑节点都有迹可循、有据可依。

### 核心设计理念

- **信息优先**：UI 是逻辑内容的容器，不争抢注意力
- **可视化驱动**：通过 React Flow 交互式图谱直观呈现业务逻辑关系
- **AI 赋能**：集成 Claude AI，辅助生成节点内容、分析完整性、发现边界条件
- **状态可追踪**：节点从草稿到确认的完整生命周期管理

---

## ✨ 功能特性

| 模块 | 功能 | 状态 |
|------|------|:----:|
| 🔐 **用户认证** | 注册 / 登录 / JWT 认证 / 登出 | ✅ |
| 🏢 **系统管理** | 创建业务系统、设置图标与颜色 | ✅ |
| 📦 **模块管理** | 系统内功能模块的组织与管理 | ✅ |
| 🧩 **逻辑节点** | 6 大核心字段：触发条件、前置依赖、主流程、分支条件、边界处理、代码关联 | ✅ |
| 🕸️ **逻辑图谱** | React Flow 可视化，支持拖拽、连线、缩放 | ✅ |
| 🔗 **节点连线** | 4 种关系类型：触发 / 依赖 / 阻断 / 扩展 | ✅ |
| 🤖 **AI 助手** | 生成节点内容、分析完整性、建议边界条件、生成测试用例 | ✅ |
| 📝 **富文本编辑** | TipTap 编辑器支持主流程富文本撰写 | ✅ |
| 👥 **团队协作** | 团队模型与成员关系（数据层已完成） | 🚧 |
| 📊 **版本管理** | 节点历史版本快照（数据层已完成） | 🚧 |

---

## 🏗️ 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [Vite](https://vitejs.dev/) | 构建工具 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 原子化 CSS |
| [shadcn/ui](https://ui.shadcn.com/) | 组件基础 |
| [React Flow](https://reactflow.dev/) (@xyflow/react) | 交互式图谱 |
| [Zustand](https://github.com/pmndrs/zustand) | 状态管理 |
| [TanStack Query](https://tanstack.com/query) | 服务端状态管理 |
| [TipTap](https://tiptap.dev/) | 富文本编辑器 |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | 表单验证 |

### 后端

| 技术 | 用途 |
|------|------|
| [Hono](https://hono.dev/) | 轻量 Web 框架 |
| [Prisma](https://www.prisma.io/) | ORM |
| [PostgreSQL](https://www.postgresql.org/) | 数据库 |
| [jose](https://github.com/panva/jose) | JWT 认证 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 密码哈希 |
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) | Claude AI 集成 |
| [Pino](https://getpino.io/) | 日志 |

### 基础设施

| 技术 | 用途 |
|------|------|
| [pnpm](https://pnpm.io/) workspace | Monorepo 管理 |
| [Docker](https://www.docker.com/) + Docker Compose | 容器化部署 |
| [Nginx](https://nginx.org/) | 静态资源与反向代理 |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 16（或使用 Docker）

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/logimap.git
cd logimap
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
# 根目录
cp .env.example .env

# API 目录
cp apps/api/.env.example apps/api/.env
```

编辑 `apps/api/.env`：

```env
# 必填
DATABASE_URL="postgresql://postgres:<密码>@localhost:5432/logimap"
JWT_SECRET="<至少 32 位的随机字符串>"

# AI 功能（可选）
ANTHROPIC_API_KEY="<your-anthropic-api-key>"

# 其他
CORS_ORIGIN="http://localhost:5173"
```

### 4. 启动数据库（Docker）

```bash
docker run -d \
  --name logimap-db \
  -e POSTGRES_PASSWORD=<密码> \
  -e POSTGRES_DB=logimap \
  -p 5432:5432 \
  postgres:16
```

### 5. 运行数据库迁移

```bash
npx prisma migrate dev
```

### 6. 启动开发服务器

```bash
# 终端 1 - 后端
cd apps/api
pnpm dev

# 终端 2 - 前端
cd apps/web
pnpm dev
```

访问 http://localhost:5173

---

## 🐳 Docker 部署

```bash
# 设置环境变量
export DB_PASSWORD=<强密码>
export JWT_SECRET=<强密钥>

# 启动全部服务
docker-compose up -d
```

服务启动后：
- 前端：http://localhost
- 后端 API：http://localhost:3001

---

## 📁 项目结构

```
logimap/
├── apps/
│   ├── web/                  # 前端应用 (React + Vite)
│   │   ├── src/
│   │   │   ├── api/          # API 客户端
│   │   │   ├── components/   # 组件 (含 shadcn/ui)
│   │   │   ├── pages/        # 页面路由
│   │   │   ├── stores/       # Zustand 状态管理
│   │   │   ├── styles/       # 样式与 Token
│   │   │   └── types/        # TypeScript 类型
│   │   ├── nginx.conf        # Nginx 配置
│   │   └── Dockerfile.web    # 前端 Docker 构建
│   │
│   └── api/                  # 后端应用 (Hono)
│       ├── src/
│       │   ├── routes/       # 路由定义
│       │   ├── services/     # 业务逻辑
│       │   ├── middleware/   # 中间件
│       │   ├── lib/          # 工具函数
│       │   └── db/           # 数据库连接
│       └── Dockerfile.api    # 后端 Docker 构建
│
├── packages/
│   └── types/                # 共享类型定义
│
├── prisma/
│   └── schema.prisma         # 数据库模型
│
├── docker-compose.yml        # Docker Compose 配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── UI-SPEC.md                # UI 设计规范文档
```

---

## 📊 数据模型

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Team   │◀────│  System │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │          ┌────┴────┐     ┌────┴────┐
     └─────────▶│ Module  │────▶│LogicNode│
                └─────────┘     └────┬────┘
                                     │
                                ┌────┴────┐
                                │Connection│
                                └─────────┘
```

**核心实体**：

- **System** — 业务系统（如「订单系统」「支付系统」）
- **Module** — 系统内的功能模块（如「结算模块」「退款模块」）
- **LogicNode** — 逻辑节点，承载业务逻辑的核心单元
  - `trigger` — 触发条件
  - `dependsOn` — 前置依赖
  - `mainFlow` — 主流程（富文本）
  - `branches` — 分支条件（JSON）
  - `edgeCases` — 边界处理（JSON）
  - `codeRef` — 代码关联
- **Connection** — 节点间关系连线（触发/依赖/阻断/扩展）

---

## 🗺️ 开发进度与路线图

### ✅ 已完成（v0.1.0）

- [x] 项目基础架构与 Monorepo 搭建
- [x] 数据库模型设计与迁移（Prisma）
- [x] 用户认证系统（注册 / 登录 / JWT / 登出）
- [x] 业务系统 CRUD 管理
- [x] 功能模块 CRUD 管理
- [x] 逻辑节点 CRUD 管理（含富文本编辑器）
- [x] 逻辑图谱可视化（React Flow 交互式图谱）
- [x] 节点连线与 4 种关系类型
- [x] AI 辅助功能（Claude API 集成）
  - [x] 智能生成节点内容
  - [x] 节点完整性分析
  - [x] 边界条件建议
  - [x] 测试用例生成
- [x] Docker 容器化部署
- [x] 响应式 UI 设计（Tailwind + shadcn/ui）

### 🚧 进行中（v0.2.0）

- [ ] 团队与成员管理界面
- [ ] 细粒度权限控制（RBAC）
- [ ] 节点审批工作流（草稿 → 评审 → 确认）
- [ ] 节点版本历史与回滚
- [ ] 全局搜索与筛选

### 📋 规划中（v0.3.0+）

- [ ] 图谱导出（PNG / SVG / PDF）
- [ ] 通知系统（站内信 / 邮件）
- [ ] 暗色模式完整支持
- [ ] 国际化（i18n，中英文）
- [ ] 单元测试与 E2E 测试覆盖
- [ ] API 文档（OpenAPI / Swagger）
- [ ] CI/CD 自动化工作流
- [ ] 性能优化（虚拟滚动、懒加载）
- [ ] 移动端基础适配

### 💡 未来方向

- [ ] 与 Git 仓库关联（代码跳转）
- [ ] 变更影响分析（当节点变更时自动提示关联节点）
- [ ] 多人实时协作编辑（WebSocket）
- [ ] 插件系统（自定义节点类型、连接器）
- [ ] 知识库集成（Confluence / Notion / Lark）

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. **Fork** 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交变更：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feat/amazing-feature`
5. 提交 **Pull Request**

### 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新功能
fix: 修复问题
docs: 文档变更
style: 代码格式（不影响逻辑）
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

---

<a name="english"></a>

## English

### Introduction

LogiMap is a **business logic visualization and management platform** designed for R&D teams. It helps teams transform scattered business knowledge into structured logic assets through **interactive visual graphs**.

In complex business systems, logic is often scattered across code comments, documentation, or even in people's heads. LogiMap provides a complete workflow from **structuring → visualizing → reviewing → preserving**, ensuring every business logic node is traceable and verifiable.

### Key Features

- **Visual Graphs**: Interactive React Flow diagrams for business logic relationships
- **Logic Nodes**: 6 core fields covering triggers, dependencies, main flow, branches, edge cases, and code references
- **AI-Powered**: Claude AI integration for content generation, completeness analysis, and edge case suggestions
- **Status Tracking**: Full lifecycle management from draft to approved
- **Team Collaboration**: Multi-team support with member management

### Quick Start

```bash
# Clone
git clone https://github.com/yourusername/logimap.git
cd logimap

# Install dependencies
pnpm install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your settings

# Run database migration
npx prisma migrate dev

# Start development servers
pnpm dev        # or run apps/api and apps/web separately
```

---

## 📄 License

[MIT](./LICENSE) © LogiMap Contributors
