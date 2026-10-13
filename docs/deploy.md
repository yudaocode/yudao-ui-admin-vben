# Tailscale 自动部署

push 到 `main` / `test` / `dev` 后，`ci.yml` 在镜像推送 GHCR 成功后（`deploy` job， `needs: push-image`），经 Tailscale 加入 tailnet，SSH 到服务器执行 `docker compose pull && docker compose up -d`，最后经 tailnet `curl` 宿主机端口做健康检查。

- 镜像：`ghcr.io/ellean/star-ecom-erp-web`（公开包，服务器拉取无需登录）
- CI 节点：tailscale/github-action@v4，OAuth client 签发，ephemeral + `tag:github-actions-xq`，每次跑完自动离网
- 服务器上的 `docker-compose.yml` 与 `.env` 由 CI 每次部署覆盖同步，仓库是唯一事实源，勿手改

## 拓扑（main / test / dev 同服务器，独立 compose project）

| 分支 | 镜像 tag | 宿主机端口 | 容器名 | compose project | 服务器目录 |
| --- | --- | --- | --- | --- | --- |
| main | main | 8010 | star-ecom-erp-web | star-ecom-erp-main | /home/edward/star-ecom-erp/main |
| test | test | 8011 | star-ecom-erp-web-test | star-ecom-erp-test | /home/edward/star-ecom-erp/test |
| dev | dev | 8012 | star-ecom-erp-web-dev | star-ecom-erp-dev | /home/edward/star-ecom-erp/dev |

部署记录在 GitHub 仓库的 Environments（main/test/dev）中可查。

## 一次性配置

### 1. Tailscale 后台（tail08f53.ts.net）

1. Access controls 的 `tagOwners` 中定义 CI 标签：

   ```json
   "tagOwners": {
     "tag:github-actions-xq": ["autogroup:admin"]
   }
   ```

   若使用自定义 ACL（非默认全通），还需放行 `tag:github-actions-xq` → 服务器 `22, 8010-8012` 端口。

2. Settings → OAuth clients → 新建：scopes 勾选 `auth_keys`（write），tags 选 `tag:github-actions-xq`。记录生成的 client ID 与 secret。注意管理台存在 OAuth client Tags 被静默丢弃的 bug（tailscale#19945），保存后务必回看确认。

### 2. GitHub 仓库配置（Settings → Secrets and variables → Actions）

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID |
| Secret | `TS_OAUTH_SECRET` | Tailscale OAuth client secret |
| Secret | `DEPLOY_SSH_KEY` | 部署专用 ed25519 私钥（完整文件内容） |
| Variable | `DEPLOY_HOST` | `xq-local.tail08f53.ts.net`（或 tailnet IP `100.73.52.43`） |
| Variable | `DEPLOY_USER` | `edward`（服务器登录用户，需在 docker 组） |
| Variable | `DEPLOY_PATH` | 部署根目录，本仓库设置为 `/home/edward/star-ecom-erp`（未配置时代码默认 `/opt/star-ecom-erp`） |

`DEPLOY_HOST` / `DEPLOY_USER` 未配置时 deploy job 会直接失败并给出提示。

### 3. 服务器一次性准备

- Docker + compose plugin 可用（`docker compose version`）；CPU 架构需为 x86_64（镜像按 amd64 构建）；部署用户在 `docker` 组（无需 sudo 执行 docker）。
- 部署公钥追加到 authorized_keys（在能登录服务器的机器上执行，用户为 `edward`）：

  ```bash
  ssh edward@xq-local.tail08f53.ts.net \
    'mkdir -p ~/.ssh && chmod 700 ~/.ssh && \
     echo "<部署公钥内容>" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
  ```

- 首次迁移：若服务器上还跑着旧的 `star-ecom-erp-web` 容器（早期手动 compose 部署），先清理避免容器名/端口冲突：`docker rm -f star-ecom-erp-web`
- `/home/edward/star-ecom-erp/<分支>` 目录由 CI 自动创建，无需手工准备。

## 日常操作

- **自动部署**：push（或合并 PR）到 main / test / dev 即自动部署对应环境；PR 事件不部署，`workflow_dispatch` 选到其他分支时跳过部署。
- **手动部署**：Actions → CI → Run workflow → 选分支（仅 main/test/dev 触发部署）；inputs 可覆盖镜像内烘焙的后端地址，谨慎使用（会同步部署到对应环境）。
- **回滚**：SSH 到服务器，将 `<目录>/.env` 的 `IMAGE_TAG` 改为旧构建的 sha tag，然后 `docker compose up -d`。注意 CI 下次部署会覆盖回分支 tag。
- **查看日志**：`docker compose -f /home/edward/star-ecom-erp/<分支>/docker-compose.yml logs -f web`

## 故障排查

| 症状 | 排查 |
| --- | --- |
| `DEPLOY_HOST is required` | 仓库 variable 未配置 |
| Join tailnet 报 `requested tags [...] are invalid or not permitted` | `.github/workflows/ci.yml` 的 `tags:` 与 OAuth client 实际 tag 不一致；以 OAuth client 的 Tags 为准同步 workflow |
| SSH 连接超时/拒绝 | 服务器是否在线；OAuth client 标签是否在 ACL 中有权访问 22 端口 |
| 健康检查 60s 超时但容器正常 | 服务器防火墙是否放行 tailscale 接口访问 8010-8012 |
| pull 失败 | GHCR 包可见性是否仍为 public；tag 是否已由 push-image 推送 |
