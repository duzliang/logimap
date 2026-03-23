# LogiMap 开发启动指南

## 前提条件

1. 安装 Node.js 20 LTS
2. 安装 pnpm 9.x
3. 安装 PostgreSQL 16 或使用 Docker

## 快速启动

### 1. 启动 PostgreSQL 数据库

**使用 Docker（推荐）：**
```bash
docker run -d \
  --name logimap-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=logimap \
  -p 5432:5432 \
  postgres:16
```

**或使用本地 PostgreSQL：**
```bash
# 确保 PostgreSQL 正在运行
# 创建数据库：createdb logimap
```

### 2. 安装依赖并生成 Prisma 客户端

```bash
cd /Users/zhiliangdu/Github/logimap
pnpm install
```

### 3. 运行数据库迁移

```bash
cd /Users/zhiliangdu/Github/logimap
npx prisma migrate dev
```

### 4. 启动开发服务器

**终端 1 - 启动后端：**
```bash
cd /Users/zhiliangdu/Github/logimap/apps/api
pnpm dev
# 后端运行在 http://localhost:3001
```

**终端 2 - 启动前端：**
```bash
cd /Users/zhiliangdu/Github/logimap/apps/web
pnpm dev
# 前端运行在 http://localhost:5173
```

## 测试流程

1. 访问 http://localhost:5173
2. 点击「立即注册」创建账户
3. 注册成功后自动跳转到 Dashboard
4. 点击「系统管理」卡片开始使用

## 常见问题

### Q: Dashboard 一直显示「加载中...」
A: 确保后端服务器正在运行（终端 1），并且数据库已启动

### Q: 注册/登录失败
A: 检查后端控制台是否有错误，确保 DATABASE_URL 配置正确

### Q: Prisma 客户端错误
A: 运行 `npx prisma generate` 重新生成客户端
