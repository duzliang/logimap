---
name: logimap-design
description: Use this skill to generate well-branded interfaces for LogiMap. Contains colors, type, fonts, assets, and UI kit for prototyping dashboard UIs.
user-invocable: true
---
# LogiMap Design Skill

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts, copy assets out and create static HTML files. If working on production code, read the rules here to become an expert in designing with this brand.

## Quick map

- `README.md` - brand context, content fundamentals, visual foundations (read first)
- `colors_and_type.css` - drop-in CSS variables for colors, type, radius, shadow, spacing
- `css.json` - structured token understanding source
- `components/index.json` - component index + cross-component patterns
- `library-consumption.json` - recommended downstream read order
- `preview/` - small HTML cards illustrating foundations and components
- `components.css` - aggregated component CSS

## Essentials at a glance

- Brand primary `#4F46E5` (indigo-violet, `--logimap-primary-600`) on a warm off-white canvas `#FAFAF9` (`--logimap-neutral-50`); cool, developer-tool aesthetic - no warm accents, no gradients.
- Radius 4 / 6 / 8 / 12 / 16px - deliberate and crisp; pill (`9999px`) reserved for status badges and chips only.
- Density first: 36px default control height (button + input), 8-pt spacing base (4/8/12/16/20/24/32/48/64), hair-thin pale `#E7E5E4` borders.
- Type: **Inter** (400/500/600/700) for all display/heading/body UI; **JetBrains Mono** (400/500) for code, node IDs, and mono labels.
- Voice: bilingual CN-first, professional, precise, developer-tool calm - no emoji in product UI (e.g. "逻辑图谱", "提交评审", "影响分析").
- Shadow philosophy: whisper-quiet, 5 near-invisible levels; nothing at rest above `shadow-1` (`0 1px 2px rgba(28,25,23,.05)`), lift only on hover/float/modal.
- Node status semantics: draft→neutral, review→warning (amber `#D97706`), approved→success (emerald `#059669`), deprecated→error (rose `#E11D48`); status rendered as pill badges with a leading dot.

## Components

| Slug | Name | Key Insight |
|------|------|-------------|
| button | Button | Brand-violet primary, whisper-quiet hover, 36px default height |
| card | Card | Layered background tints over whisper-quiet shadows; clickable cards lift subtly |
| input | Input | Sunken inset background, violet focus ring, 36px height |
| table | Table | Row-hover tint instead of borders; status badges inline for node states |
| navigation | Navigation | Sidebar tree with violet-tint active state; 32px row height |
| modal | Modal | 48% black overlay with 2px blur; centered panel for node editor |
