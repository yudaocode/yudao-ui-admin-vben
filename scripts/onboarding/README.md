# 团队 Onboarding 脚本

按序执行（首次从零搭建）：

1. `./01-verify-env.sh` — 验证 Node/pnpm/corepack（要求 Node ≥ v22.18.0）
   - Windows PowerShell 用户用 `01-verify-env.ps1`
2. 在 GitHub 上 Fork `yudaocode/yudao-ui-admin-vben` 到本组织
3. 修改 `02-clone-repo.sh` 顶部 `ORG_NAME`，执行 clone + 配上游
4. `./05-install-deps.sh` — 安装依赖（必须 pnpm）
5. 启动 yudao 后端（:48080），见 https://doc.iocoder.cn/quick-start/
6. `./06-start-dev.sh` — 启动 web-antd，访问 http://localhost:5666，`admin` / `admin123`

> **运行位置说明**：`02`、`05`、`06` 设计为在**仓库父目录**运行（脚本内 `cd yudao-ui-admin-vben`）；`03`、`04` 在**仓库根目录**运行；`01` 任意位置。

日常维护：

- `./04-sync-upstream.sh` — 每 2 周同步上游（建议先备份 main：`git checkout main && git checkout -b backup/before-sync-YYYYMMDD`）

> 定制代码统一放 `apps/web-antd/src/views/custom/`，避免上游同步冲突。
