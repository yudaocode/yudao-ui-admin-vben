# yudao-ui-admin-vben

> 基于 [vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) v5.7.0 + Ant Design Vue 的 yudao 前端，团队二次开发与定制化交付 fork。
>
> - **origin（团队 fork，日常 push）**：<https://github.com/pangyihua/yudao-ui-admin-vben>
> - **upstream（yudao 官方，sync 来源）**：<https://github.com/yudaocode/yudao-ui-admin-vben>

## 远程与分支模型

| 远程       | 仓库                            | 用途                         |
| ---------- | ------------------------------- | ---------------------------- |
| `origin`   | `pangyihua/yudao-ui-admin-vben` | 团队 fork，日常开发与 push   |
| `upstream` | `yudaocode/yudao-ui-admin-vben` | yudao 官方上游，定期同步来源 |

- 主分支：`master`。
- 主交付应用：`@vben/web-antd`。
- 定制代码隔离于 `apps/web-antd/src/views/custom/`，优先新增文件、避免直改上游文件（降低 sync 冲突）。

## 环境要求

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| Node | `^22.18.0` 或 `^24.0.0`（推荐 v24） | 见 `package.json` 的 `engines` |
| pnpm | `>= 11.0.0` | 强制（`preinstall` 有 `only-allow pnpm`）；`packageManager` 锁定 `pnpm@11.7.0` |

环境校验：

```bash
bash scripts/onboarding/01-verify-env.sh
```

## 快速启动

```bash
pnpm install          # 安装依赖（含 lefthook 预提交钩子安装）
pnpm dev:antd         # 启动 web-antd（前端端口 5666）
# 或交互式选择应用：
pnpm dev
```

## 后端连接

开发态配置在 `apps/web-antd/.env.development`：

| 配置     | 值                       |
| -------- | ------------------------ |
| 前端端口 | `5666`                   |
| 后端地址 | `http://127.0.0.1:48080` |
| 接口前缀 | `/admin-api`             |
| 默认账号 | `admin / admin123`       |

> 需先启动 yudao 后端（Spring Boot，端口 48080）。

## 同步 upstream

### 何时同步

当 yudaocode 上游有新提交时（建议每 2 周一次）。先检查是否需要：

```bash
git fetch upstream
git log --oneline master..upstream/master
# 无输出 = upstream 已完全包含，无需同步
```

### 方式一：一键脚本

```bash
bash scripts/onboarding/04-sync-upstream.sh
```

脚本流程：切 `upstream-sync` 分支 → `fetch upstream` → `merge upstream/master` → 解决冲突（若有）→ 推送 `upstream-sync` → 合回 `master` → 推送 `master`。

### 方式二：手动流程（基于 master）

```bash
git checkout master
git fetch upstream
git log --oneline master..upstream/master   # 查看待合入
git merge upstream/master
# 若冲突：解决后 git add . && git commit
git push origin master
```

### 冲突预防

- 定制代码入 `apps/web-antd/src/views/custom/`，优先新增文件而非改上游文件。
- 已知改动面（`README.md`、`turbo.json`、`.github/`、`.github/CODEOWNERS`、`docs/`）在 sync 时重点核对。
- 约束工具与 CI 配置均以新增文件或 catalog 覆盖实现（见 `docs/adr/`），不直改上游源文件。

## 常用命令

| 命令                  | 用途                                     |
| --------------------- | ---------------------------------------- |
| `pnpm dev:antd`       | 启动 web-antd 开发                       |
| `pnpm dev`            | 交互式选择应用启动                       |
| `pnpm build:antd`     | 构建 web-antd                            |
| `pnpm build:analyze`  | 构建 + bundle 分析（`stats.html`）       |
| `pnpm lint`           | oxlint + eslint + stylelint + oxfmt 检查 |
| `pnpm format`         | oxfmt 自动格式化                         |
| `pnpm check:type`     | 全量类型检查（vue-tsc）                  |
| `pnpm test:unit`      | 单元测试（vitest）                       |
| `pnpm check:circular` | 循环依赖检测                             |
| `pnpm check:dep`      | 依赖检查                                 |

## 二次开发规范

- **定制隔离**：业务定制代码入 `apps/web-antd/src/views/custom/`，优先新增文件、catalog 覆盖，避免直改上游文件。
- **FSD 依赖边界**：复用上游 `no-restricted-imports`（`error` 级，pre-commit 强制执行）——见 [`docs/adr/0001`](./docs/adr/0001-fsd-boundaries-tooling.md)。
- **依赖管理**：版本由 `pnpm-workspace.yaml` catalog 统一——见 [`docs/adr/0005`](./docs/adr/0005-pnpm-catalog-scope.md)。
- **提交规范**：commitlint（`feat:` / `fix:` / `chore:` 等，scope 限白名单）；lefthook 预提交链：oxlint → oxfmt → eslint → stylelint → checkType。
- **CI 门禁**：`.github/workflows/ci-team.yml`（test + lint + typecheck + build + ci-ok，turbo 缓存）——见 [`docs/adr/0002`](./docs/adr/0002-remote-cache.md)、[`docs/adr/0003`](./docs/adr/0003-ci-platform.md)。

## 文档索引

- [`docs/adr/`](./docs/adr/README.md) — 架构决策记录（FSD 边界、Turborepo 缓存、CI 平台、定制代码隔离、catalog 边界）。
- [`docs/perf/baseline-web-antd-2026-07-28.md`](./docs/perf/baseline-web-antd-2026-07-28.md) — web-antd 构建基线与 bundle 分析。
- [`scripts/onboarding/`](./scripts/onboarding/) — 环境校验、克隆、upstream 配置、同步、依赖安装、启动（`01`~`06`）。

## 上游与许可

- 基于 [vbenjs/vue-vben-admin](https://github.com/vbenjs/vue-vben-admin) v5.7.0（MIT）与 [yudaocode/yudao-ui-admin-vben](https://github.com/yudaocode/yudao-ui-admin-vben)。
- vben 框架文档：<https://doc.vben.pro/>
- yudao 文档：<https://doc.iocoder.cn/>
