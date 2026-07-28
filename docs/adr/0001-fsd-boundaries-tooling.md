# 0001. FSD 依赖约束工具选型

- 状态：Accepted
- 日期：2026-07-28

## Context

Vben v5 现有分层（`apps` / `effects` / `@core` / `packages`）并非标准 FSD，`effects` 混合了 features 与 pages 的职责，部分 package 间存在循环依赖风险（项目已配置 `check:circular` 检测）。为收敛依赖方向、拦截违规跨层导入，需引入依赖边界约束。

依赖方向约束须落在 ESLint 上——主力 linter oxlint 暂不支持 import 边界规则。

## Decision

采用 [`eslint-plugin-boundaries`](https://github.com/javierbrea/eslint-plugin-boundaries)，通过 `element-types` 规则声明 Vben 适配版分层（app / pages / features / entities / shared），规则**先 `warn`、稳定 2 周后升 `error`**。配置集中在 `internal/lint-configs/eslint-config/`。

## Consequences

- 正向：依赖方向可机器校验，CI 可拦截跨层导入，长期保障分层清晰。
- 代价：Vben 现有代码可能存在存量违规，需先 `warn` 过渡并逐步清理。
- 后续：违规清单（Task 8 采集）清理完成后升 `error`（Task 9）。
