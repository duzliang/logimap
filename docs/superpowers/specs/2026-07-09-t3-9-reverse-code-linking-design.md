# T3-9 代码反向关联 — 设计文档

- **任务 ID**：T3-9（代码关联深化）
- **依赖**：T3-7（codeRef 解析增强）、T3-19（MCP 服务接口）
- **验收标准**：设计文档完成 + 可运行的反查能力（API / MCP / Web）
- **日期**：2026-07-09

---

## 1. 背景与目标

现有 codeRef 是「逻辑节点 → 代码」的**正向**关联：节点上记录一段自由文本
（`src/services/settlement.ts#calculateSettlement`、GitHub 永久链接等），
点击可跳转到代码（T3-7）。

T3-9 要解决的是**反向**问题：开发者在代码编辑器里打开某个文件时，
希望立刻看到「这个文件 / 这一行被哪些逻辑节点引用」，从而把业务逻辑图谱
带到编码现场。核心是一次**反查**：给定文件路径（及可选行号）→ 返回引用它的节点列表。

## 2. 关键设计：匹配算法

节点侧的 codeRef 形态多样（相对路径、行号锚点、GitHub/GitLab 永久链接、裸符号），
查询侧给出的路径也可能是仓库相对路径或编辑器里的绝对路径。因此不能做字符串等值比较。

在共享层 `packages/types/src/code-ref.ts` 增加：

- `normalizeCodePath(path)`：归一化——反斜杠转正斜杠、去查询/锚点、去前导 `./` 与 `/`、小写。
- `isSameCodeFile(a, b)`：**路径尾部段匹配**。归一化后按 `/` 分段，较短者若是较长者的
  连续尾部段则命中。可容忍「仓库相对 vs 绝对路径」的长度差。
- `matchesCodePath(codeRef, { filePath, line? })`：反查核心。
  - 裸符号（无法定位文件）永不命中；
  - 文件用 `isSameCodeFile` 匹配；
  - 带 `line` 且节点声明了行号区间 → 要求行号落在 `[lineStart, lineEnd]` 内；
  - 节点未声明行号 → 视为覆盖整文件，行号不参与过滤。

匹配逻辑放在共享包，保证 API、MCP、（未来的）编辑器插件三处行为一致。

## 3. 交付面

### 3.1 API — `GET /api/v1/code-links`

- 入参：`teamId`、`path`、可选 `line`（`CodeLinkQuerySchema`）。
- 鉴权：`requireTeamRole(VIEWER, fromQuery('teamId'))`，仅团队成员可查。
- 实现：`CodeLinksService.findNodesByPath()`。用 `codeRef` 的 trigram GIN 索引
  （`idx_logic_node_code_ref_trgm`）先按归一化文件名做候选粗筛，再用 `matchesCodePath`
  精确判定，返回 `CodeLinkNode[]`（含 module/system 上下文，便于跳转）。
- 出参：`CodeLinkResult`（`{ path, line?, count, nodes }`）。

### 3.2 MCP 工具 — `find_nodes_by_code`

在 `apps/api/src/mcp/tools.ts` 增加只读工具，入参 `teamId` / `path` / 可选 `line`，
复用同一 service。这就是「编辑器插件查看关联节点」的落地通道：Cursor / Claude Code
通过已建成的 MCP 服务端（T3-19，API Token 鉴权）即可在编码现场反查节点。

### 3.3 Web — 「代码反向关联」页面

`/code-links` 页面：选择团队 + 输入文件路径（可选行号）→ 展示命中节点列表，
每个节点可跳转到节点详情页。作为浏览器可验证入口，也方便无插件用户手动反查。

## 4. 编辑器插件（远期，本任务只做设计）

编辑器插件不在本次实现范围，设计如下，后续可直接落地：

1. 插件读取当前文件相对仓库根的路径与光标行号。
2. 通过 MCP（stdio）或 HTTP + API Token 调 `find_nodes_by_code`。
3. 在侧栏 / CodeLens 展示命中节点（名称、状态、所属系统/模块），点击用
   `logimap://node/<id>` 或 Web 深链打开。
4. 团队 / 仓库映射：插件配置 `teamId` 与本地仓库根，路径按仓库根相对化后传入，
   与节点 codeRef 的仓库相对路径对齐。

## 5. 测试策略

- 共享层：`matchesCodePath` / `isSameCodeFile` / `normalizeCodePath` 单元测试
  （相等、尾段匹配、行号区间命中/越界、裸符号、整文件覆盖）。
- API：service + route 集成测试（命中、行号过滤、跨团队隔离、空结果）。
- MCP：`find_nodes_by_code` dispatch 测试（命中 + 越权拒绝）。

## 6. 非目标（YAGNI）

- 不做代码内容抓取比对（那是 T3-2 一致性检查的范畴）。
- 不做模糊符号搜索，只按文件 + 行号定位。
- 不实现真正的 VSCode/JetBrains 插件，仅出设计 + 提供 MCP/HTTP 反查端点。
