# Architecture Decision Records (ADR)

本目录记录 `yudao-ui-admin-vben` 二次开发与定制化交付中的关键架构决策。每条 ADR 遵循：**Context → Decision → Consequences**。

## 状态索引

| 编号                                     | 标题                   | 状态     |
| ---------------------------------------- | ---------------------- | -------- |
| [0001](./0001-fsd-boundaries-tooling.md) | FSD 依赖约束方案       | Accepted |
| [0002](./0002-remote-cache.md)           | Turborepo 远程缓存方案 | Accepted |
| [0003](./0003-ci-platform.md)            | CI 平台与门禁集        | Accepted |
| [0004](./0004-custom-code-isolation.md)  | 定制代码目录隔离       | Accepted |
| [0005](./0005-pnpm-catalog-scope.md)     | pnpm catalog 统一边界  | Accepted |

## 模板

```markdown
# NNNN. 标题

- 状态：Accepted / Proposed / Superseded by NNNN
- 日期：YYYY-MM-DD

## Context

（背景与驱动力）

## Decision

（决定与理由）

## Consequences

（结果、代价、后续动作）
```
