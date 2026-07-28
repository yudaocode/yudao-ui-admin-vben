# 0005. pnpm catalog 统一边界

- 状态：Accepted
- 日期：2026-07-28

## Context

Monorepo 多包场景下，同一依赖易出现多版本漂移，导致构建不确定性。

## Decision

核心依赖（Vue / Pinia / Vite / Ant Design Vue 等）统一进入 `pnpm-workspace.yaml` 的 `catalog:`，各包以 `"vue": "catalog:"` 形式引用。**仅统一无 peer 约束的核心库**，其余依赖渐进收敛。

## Consequences

- 正向：核心依赖版本全仓唯一，消除漂移。
- 代价：存在 peer 约束的依赖强行统一可能触发冲突，需渐进处理。
- 后续：定期审计 catalog，新增核心库及时纳入。
