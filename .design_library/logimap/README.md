# LogiMap Design System

A design system for **LogiMap** — the business-logic visualization and governance platform for engineering teams. It turns scattered business knowledge (in code, docs, meetings, brains) into a searchable, reviewable, traceable logic-asset graph. The system is purpose-built for a dashboard-type, Chinese-first engineering tool.

> *"Cool indigo-violet brand anchored at #4F46E5 on a warm off-white canvas (#FAFAF9). Minimal whisper-quiet shadows, crisp geometry, generous whitespace."* — visual tone brief

### What this design system covers

- **Foundations** — color (indigo-violet primary on warm stone neutrals), typography (Inter + JetBrains Mono), 4px-base spacing, six-step radius, five whisper-quiet shadow layers.
- **Components** — six documented patterns: Button, Card, Input, Table, Navigation, Modal.
- **Sample kit** — dashboard-type interactive previews plus a drop-in `colors_and_type.css` token file.

---

## CONTENT FUNDAMENTALS

### Voice & tone

LogiMap 用中文表达，语气专业、克制、精确，是一个面向工程团队的 developer-tool 语域。文案以名词短语和动词短语为主，不带任何 emoji，不口语化，不营销化。界面用词紧贴业务逻辑治理的真实动作——"提交评审""影响分析""代码关联"——而不是泛化的"保存""删除"。状态用语压到两个汉字以内（"草稿""已确认"），节点命名直接使用业务实体（"退款申请""订单结算"），让人一眼读到领域语言而非 UI 元素。整体读感是 Linear 的精准加上 Eraser.io 的工程师气质：信息密度高，但留白慷慨，绝不喧闹。

### Concrete copy examples (lifted from the product)

- 图谱主区标题：*"逻辑图谱"*
- 主操作按钮：*"创建节点"*
- 审批流转动作：*"提交评审"*
- AI 能力入口：*"AI 生成"*
- 节点 / 业务实体命名：*"退款申请"*、*"订单结算"*
- 状态标签：*"草稿"*、*"已确认"*
- 侧栏入口：*"全局搜索"*、*"版本历史"*、*"代码关联"*

### When generating copy

- 用业务领域语言命名节点与模块（退款申请、订单结算），不要用"项目 A""示例 B"这类占位词；领域词本身就是信息架构的一部分。
- 动作按钮用"动词 + 名词"两到四字（创建节点、提交评审、影响分析），保持节奏一致；避免"立即创建""马上提交"等助词冗余。
- 状态词压到两字以内（草稿、已确认），与彩色徽章配合，让颜色承担状态识别、文字承担精确语义。
- AI 相关入口统一写"AI 生成"而非"智能生成""一键生成"，保持工具属性、不夸大能力。

---

## VISUAL FOUNDATIONS

### Color

LogiMap 的色彩体系是一组冷调靛紫主色落在暖石色中性画布上的对话。主色锚定在 `#4F46E5`（`--logimap-primary-600`），这是一颗偏蓝的靛紫，干净、技术、克制——没有暖色点缀，没有默认渐变。主色阶从 `#EEF2FF`（50，近乎透明的淡靛）到 `#312E81`（900，深邃午夜靛）共十档，主要消费 500–700 三档：500 `#6366F1` 用于聚焦环（`--ring`），600 是默认填充，700 `#4338CA` 用于悬停加深。

中性色不是冷灰，而是一组暖石色（stone）：从画布底 `#FAFAF9`（neutral-50，带极淡暖意）到 `#1C1917`（neutral-900，近黑暖褐）。这套暖中性是 LogiMap 区别于纯冷调技术产品的关键——它让大面积留白不显冰冷。常用档位是 100 `#F5F5F4`（凹陷表面 / muted）、200 `#E7E5E4`（默认描边）、300 `#D6D3D1`（输入框描边）、500 `#78716C`（次要文字）。

语义色直接映射节点状态生命周期：草稿（DRAFT）用中性灰，评审中（REVIEW）用琥珀（warning-500 `#F59E0B`），已确认（APPROVED）用翡翠绿（success-500 `#10B981`），已废弃（DEPRECATED）用玫瑰红（error-500 `#F43F5E`）。每档语义色虽定义了 50–900 全阶，但实际消费集中在浅底（50/100）做徽章背景、深色（600/700）做徽章文字与点缀，中段使用稀疏。info 用天空蓝（`#0EA5E9`），与主色靛紫同属冷调，不抢戏。

**Vibe：** 整体色彩气质是"冷主色 + 暖底色"的张力——靛紫给出技术精确感，暖石底色给出亲和与呼吸。五层阴影全部基于 `rgba(28,25,23,…)`（即 neutral-900 暖黑），从不使用纯黑，保证阴影也是暖的。这是一个 Linear 式精准、Eraser.io 式工程师气质、Whimsical 式轻盈的混合体。

### Typography

字体策略极简且分工明确：**Inter** 承担全部展示、标题与正文（display / heading / body），**JetBrains Mono** 独占代码与等宽场景（`codeRef` 字段、版本号、技术标识）。两个字体族均通过 Google Fonts 加载，权重消费 400 / 500 / 600 / 700 四档。Inter 的几何感与中性气质匹配主色的冷调精确，JetBrains Mono 则给代码关联区带来 unmistakable 的工程师辨识度——从不使用"系统字体栈"顶替拉丁文。

字号阶是克制的小步进：display 32px / h1 24px / h2 20px / h3 17px / h4 15px / lead 16px / body 14px / caption 12px / mono 13px。正文固定 14px，是 dashboard 信息密度的合理基线；caption 12px 用于元信息与徽章文字；mono 13px 略大于 caption，让代码片段在视觉上独立成块。行高采用"标题紧、正文松"的策略：display 1.15 / h1 1.25 逐级放松，到 body 1.55、lead 1.6，保证多行业务描述可读；caption 与 mono 收在 1.4–1.55，维持标签与代码的紧凑感。

### Spacing

4px 是唯一基础单位，token 从 `--space-1`（4px）到 `--space-16`（64px），覆盖 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 九档。组件高度在此体系内固定：默认按钮 36px（`--size-button-md`）、输入框 36px（`--size-input`）、小按钮 32px、图标 16/20/24px。侧栏导航项与搜索框统一 32px 高，与按钮小号对齐，形成稳定的横向节奏。

### Radius

圆角是 LogiMap 几何气质的核心，六档刻意分层、各司其职。`radius-xs` 4px 保留给最小原子；`radius-sm` 6px 用于模态内输入框与关闭按钮等需要"稍硬"边界的次级控件；`radius-md` 8px 是控件主力——按钮、输入框、导航项、搜索框统一 8px，保持一致的"工程感"圆角；`radius-lg` 12px 用于卡片、表格这类承载内容的容器，比控件略柔；`radius-xl` 16px 专属模态面板，是全局最大圆角，给浮层以分离感；`radius-full` 9999px 仅用于状态徽章与头像，绝不用在按钮上。这套分层让"控件—容器—浮层"三个层级一眼可辨。

### Shadow / Elevation

五层阴影，全部 whisper-quiet，从不喧哗。level 1（`0 1px 2px rgba(28,25,23,.05)`）是卡片静态态，几乎只是描边的延伸；level 2（`0 2px 6px -1px rgba(28,25,23,.08)`）是卡片悬停，轻微抬起；level 3（`0 6px 16px -4px rgba(28,25,23,.12)`）用于可点击卡片悬停与浮动元素；level 4（`0 14px 32px -8px rgba(28,25,23,.18)`）专属模态；level 5（`0 24px 48px -12px rgba(28,25,23,.24)`）用于全局遮罩层。所有阴影共享同一暖黑基色，且纵向偏移与模糊半径都带负值收束，保证影子"贴着"对象而非"漂浮"——这是 Linear 式的克制。

### Borders, Backgrounds

LogiMap 用分层背景色阶代替重度抬升来表达层级，而非堆叠阴影。画布 `#FAFAF9`、表面 `#FFFFFF`、凹陷表面 `#F5F5F4` 三层构成主要的层次语言：卡片是白底浮在暖画布上，凹陷区用 neutral-100 沉下去。描边统一用 `--logimap-neutral-200`（`#E7E5E4`）这种极淡暖灰，1px，发丝级——它存在但不抢戏。输入框描边稍深（neutral-300 `#D6D3D1`）以增强可点击暗示，聚焦时切到主色并叠 2px `--ring` 光环。深色模式下整套 token 切换为暖褐黑（背景 `#0C0A09`、表面 `#1C1917`），阴影转为纯黑透明阶，保持同样的"暖底 + 克制阴影"哲学。

---

## Component Patterns

| Component | Preview | Key Insight |
|---|---|---|
| Button | `preview/component-button.html` | 四变体（primary/secondary/danger/ghost）统一 36px 高、8px 圆角；ghost 与 secondary 共用 muted 底，danger 用 error 实色填充并靠 `filter:brightness(.92)` 做悬停，不用色阶切换。 |
| Card | `preview/component-card.html` | 三种语义：content-card（信息卡）、clickable-card（悬停升至 shadow-3）、node-card（左侧 3px 状态色条 + 220px 固定宽），节点卡色条直接编码审批状态。 |
| Input | `preview/component-input.html` | 36px 高、muted 底而非纯白，聚焦时切白底 + 主色描边 + 2px ring 光环；支持 `is-error` 切 error 描边，图标槽 16px 透明度 0.7。 |
| Table | `preview/component-table.html` | `border-collapse:separate` + 外层 radius-lg 包裹；状态徽章用 `::before` 6px 圆点 + 浅底深字，四态（neutral/success/warning/error）精确映射节点生命周期。 |
| Navigation | `preview/component-navigation.html` | 240px 固定宽侧栏；激活项用 primary-50 淡底 + primary 文字 + 加粗，而非实色高亮——保持轻量；nav-badge 实色 primary 计数胶囊。 |
| Modal | `preview/component-modal.html` | 遮罩 `rgba(0,0,0,.48)` + `backdrop-filter:blur(2px)`；面板 max-width 480px、radius-xl、shadow-4，是全局最大圆角与最重阴影的容器。 |

---

## Index

- `README.md` — 本文件，品牌叙事与视觉基础（先读此文件）
- `SKILL.md` — Agent 技能入口与设计决策速览
- `colors_and_type.css` — 运行时即用 CSS 变量（颜色、字体、间距、圆角、阴影），链入即可
- `css.json` — 结构化 token 的 JSON 表示，供程序化消费
- `components.css` — 从 preview 页面自动提取的聚合组件 CSS
- `components/{slug}.json` — 六个组件的结构化契约（button/card/input/table/navigation/modal）
- `preview/component-{slug}.html` — 每个组件的小型 HTML 预览卡

---

## Caveats / known substitutions

1. **Inter 与 JetBrains Mono** 通过 Google Fonts CDN 加载（`@import` 在 `colors_and_type.css` 顶部）。在离线或内网环境无法加载时，Inter 回退到系统无衬线（macOS 上 SF Pro / Helvetica Neue 较接近其几何中性气质），JetBrains Mono 回退到 `ui-monospace` / `SF Mono` / Menlo。回退会损失字重精确度，但版式节奏不变。
2. **语义色阶稀疏**：success / info / warning / error 四组虽定义了 50–900 全阶，但实际只消费浅底（50/100）与深字（600/700）少数几档，中段（300/400/500 的部分）在现有组件中未被引用，属于预留档位，勿误以为存在对应的消费组件。
3. **所有 token 标注为 AI-generated**：`colors_and_type.css` 中每个变量都带 `/* AI-generated */` 注释，说明这版 token 体系是基于品牌简报推理生成而非从 Figma 实测抽取。颜色与字号经过合理性校准，但像素级精度（如 h3 用 17px 而非 16/18）属于推断值。
4. **组件契约为推断来源**：六组件的 JSON 契约（`components/*.json`）为 `from-scratch` / 结构化推断来源，confidence 为 medium，部分尺寸与状态轴由 preview HTML 反推，未经真实设计源逐像素确认。
5. **暗色模式 token 已定义但组件 CSS 未单独区分**：`.dark` 选择器覆盖了基础 token，但 `components.css` 中的组件样式未单独写暗色变体，依赖 token 自动级联；个别硬编码值（如 `rgba(0,0,0,.48)` 遮罩）在暗底下可能偏重，需在使用时复核。
6. **中文字体缺口**：Inter 不含中文字形，中文实际渲染依赖系统中文字体（macOS PingFang SC、Windows 微软雅黑）。品牌未指定专属中文字体族，`--font-body` 仅声明 `'Inter', sans-serif`，中文回退由系统决定——若需统一中文观感需手动追加 PingFang SC / Noto Sans SC 到字体栈。
