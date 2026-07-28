# 0002. Turborepo 远程缓存方案

- 状态：Accepted
- 日期：2026-07-28

## Context

Turborepo 本地缓存仅惠及单机。15+ 人团队与 CI 需共享构建产物缓存，以降低重复构建时间（目标：CI 二次构建命中缓存 ≤60s）。

## Decision

采用 **Vercel 远程缓存**：本地 `turbo login` + `turbo link` 关联项目；CI 用 `TURBO_TOKEN` + `TURBO_TEAM` 环境变量认证（写入 GitHub Actions secrets）。

## Consequences

- 正向：免费、接入最简，跨成员与 CI 共享缓存。
- 代价：依赖 Vercel 账号；国内网络可能不稳定。
- 后续：若稳定性不足，转自托管 `turborepo-remote-cache`（届时以新 ADR Supersede 本条）。
