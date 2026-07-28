# 0002. Turborepo 缓存方案（GitHub Actions cache）

- 状态：Accepted（2026-07-28 修订）
- 日期：2026-07-28
- 修订：原决策"Vercel 远程缓存"调整为方案 B（GitHub Actions cache），Vercel 降为可选升级路径。

## Context

Turborepo 本地缓存仅惠及单机。CI 需持久化 turbo 任务缓存跨 run 复用，降低重复构建时间。

## Decision

采用 **GitHub Actions cache**（方案 B）：在 CI（`.github/workflows/ci-team.yml`）的 typecheck/build job 用 `actions/cache@v4` 持久化 `.turbo` 与 `node_modules/.cache/turbo`，key 为 `${{ runner.os }}-turbo-${{ github.sha }}` + restore-keys 前缀回退。**无需外部账号。**

## Consequences

- 正向：零外部依赖、零网络风险（国内可达 GitHub Actions），CI 跨 run 复用 turbo 缓存。
- 代价：仅限单 repo 内 CI 跨 run 共享，**不跨成员本机**（开发者本机各自缓存）；非真正的远程共享缓存。
- 后续：若需跨成员本机 + CI 统一共享，升级为 Vercel 远程缓存（`turbo login`/`turbo link` + `TURBO_TOKEN`/`TURBO_TEAM` secrets）或自托管 `turborepo-remote-cache`，届时以新 ADR Supersede 本条。
