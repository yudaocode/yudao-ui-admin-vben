# 0001. FSD 依赖约束（复用上游 no-restricted-imports）

- 状态：Accepted（2026-07-28 修订）
- 日期：2026-07-28
- 修订：原决策"引入 eslint-plugin-boundaries（warn→error）"经实施期复审 **Superseded**

## Context

Vben v5 现有分层（`apps` / `effects` / `@core` / `packages`）并非标准 FSD，`effects` 混合了 features 与 pages 的职责，部分 package 间存在循环依赖风险（项目已配置 `check:circular` 检测）。为收敛依赖方向、拦截违规跨层导入，需依赖边界约束。

约束须落在 ESLint 上——主力 linter oxlint 暂不支持 import 边界规则。

**实施期复审发现（2026-07-28）**：上游 `@vben/eslint-config` 的 `custom-config.ts` 已用 ESLint 原生 `no-restricted-imports` 实现 FSD 风格依赖约束，且全部为 `error` 级，经 pre-commit eslint job 实际执行。原 ADR 假设的"上游无约束、需 warn 渐进"前提不成立。

## Decision

**复用上游 `no-restricted-imports` 约束，不引入 `eslint-plugin-boundaries`。**

上游已实现的约束（均 `error`）：

| 层                                       | 约束                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `apps/**`                                | 禁直引 `#/api`、`#/layouts`、`#/locales`、`#/stores`（须走 @core 包） |
| `packages/@core/**`                      | 禁依赖 `@vben/*`（核心不依赖业务）                                   |
| `packages/@core/base/**`                 | 禁依赖 `@vben/*` 与 `@vben-core/*`（最底层）                         |
| `packages/{types,utils,...,locales}/**`  | 禁依赖 `@vben/*`（底层工具包 8 个全列）                              |

审计确认：约束组 files 列表与 `packages/*` 一级工具包（types/utils/icons/constants/styles/stores/preferences/locales，共 8 个）完全吻合；`@core/**` 与 `@core/base/**` 覆盖整个核心树；effects 业务层不约束（合理）。**无遗漏，无需补漏。**

## Consequences

- 正向：零额外配置即获得 `error` 级 FSD 约束，依赖方向已机器校验；不引入新依赖、不改上游 `@vben/eslint-config`，upstream-sync 零冲突。
- 代价：`no-restricted-imports` 基于 glob + 包名前缀，不如 `eslint-plugin-boundaries` 的 element-types 精细（无依赖图可视化）；但已满足当前分层需求。
- 后续：若未来 effects 层内部需方向约束，或需依赖图可视化，再评估引入 boundaries 作为增强——经根 `eslint.config.mjs` 的 `defineConfig([...patch])` 扩展点注入，不改上游。
