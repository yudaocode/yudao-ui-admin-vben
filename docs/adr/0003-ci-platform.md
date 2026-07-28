# 0003. CI 平台与门禁集

- 状态：Accepted
- 日期：2026-07-28

## Context

PR 质量需自动化门禁保障，避免未通过 lint/type/test/build 的改动合入主干。仓库 Fork 托管在 GitHub，默认分支为 `master`。

## Decision

CI 采用 **GitHub Actions**，门禁执行 `lint` + `check:type` + `test:unit` + `build`，走 turbo 增量 filter（`--filter=...[HEAD^]`），配合 `master` 分支保护（要求 Code Owner 审核 + CI 全绿方可合并）。前置条件：`turbo.json` 已声明上述 task。

## Consequences

- 正向：PR 合并前全绿，质量与依赖方向均可控。
- 代价：`TURBO_TOKEN` 须走 GitHub secrets，不得入库。
- 后续：按需增加 Pact 契约测试、Bundle 体积预算门禁（Phase 2）。
