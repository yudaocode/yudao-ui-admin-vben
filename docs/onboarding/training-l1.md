# 团队培训 L1 大纲

> 对应实施计划 Task 12。目标：全员建立 Monorepo 与 Vben 工程化的基础认知，覆盖率 100%。

## 实操部分（与前置阶段 Task 2 合并）

- Fork + Clone + 环境验证（`scripts/onboarding/01-verify-env.sh`）
- `pnpm install` + `pnpm dev:antd` 跑通（端口 5666，admin/admin123）
- 后端联调（yudao-server :48080，菜单动态加载）
- 首个 PR 流程（commitlint + lefthook + PR 合入 master）

## 理论部分（工程化阶段，Task 3-7 落地后讲授）

1. **Monorepo 与 Vben 分层**：`apps` / `packages`（@core / effects）/ `internal` 各层职责
2. **pnpm catalog 统一机制**：为何与如何用 `catalog:` 引用（ADR 0005）
3. **Turborepo tasks 与远程缓存**：`tasks` 编排、`outputs`、Vercel 远程缓存（ADR 0002）
4. **CI 流水线与 PR 门禁**：GitHub Actions 跑哪些门禁、增量 filter、分支保护（ADR 0003）
5. **FSD 依赖约束**：`eslint-plugin-boundaries` 的 warn→error 演进（ADR 0001）

## 验收

- [ ] 实操：本地跑通 + 首个 PR（前置阶段 Task 2 门禁）
- [ ] 理论：能口述上述 5 项机制
- 覆盖率目标：100%（缺席者补训）
