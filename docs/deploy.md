# Tailscale 自动部署

push 到 `main` / `test` / `dev` 后，`ci.yml` 在镜像推送 GHCR 成功后（`deploy` job， `needs: push-image`），经 Tailscale 加入 tailnet，SSH 到服务器执行 `docker compose pull && docker compose up -d`，最后经 tailnet `curl` 宿主机端口做健康检查。

每个环境的 compose project 内含一个 Tailscale sidecar 容器（与 web 共享网络命名空间）并开启 Funnel：三个环境各一个独立节点，公网 443 由 tailscale 终结 TLS 后代理到容器内 nginx。Funnel 生效即公网可直接访问，宿主机 8010-8012 端口与 CI 健康检查不受影响。

web 容器内 nginx 同时承担前端静态托管与**后端同源反代**：`scripts/deploy/default.conf.template`（容器启动时 envsubst 渲染）将 `/admin-api`、`/infra/ws`（WebSocket）、`/actuator/health` 及 Druid / Knife4j / 积木报表 / SBA 等路径代理到 `BACKEND_UPSTREAM`。前端镜像不烘焙任何后端地址；后端位置由 CI 写入服务器 `.env` 的 `BACKEND_UPSTREAM` 决定，当前指向宿主机 `host.docker.internal:48080`（后端新栈上线后切 `host.docker.internal:802x`，仅需改 ci.yml 一行）。

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

`.env` 键（CI 写入）：`COMPOSE_PROJECT_NAME` / `IMAGE_TAG` / `HOST_PORT` / `CONTAINER_NAME` / `TS_HOSTNAME` / `TS_AUTHKEY` / `BACKEND_UPSTREAM`。

## Funnel 公网入口（每环境一个节点）

| 分支 | Funnel 入口                                 |
| ---- | ------------------------------------------- |
| main | https://star-ecom-erp-main.tail08f53.ts.net |
| test | https://star-ecom-erp-test.tail08f53.ts.net |
| dev  | https://star-ecom-erp-dev.tail08f53.ts.net  |

- sidecar 镜像 `tailscale/tailscale:stable`，`network_mode: 'service:web'` 共享 web 命名空间，serve 配置内联在 compose 文件（`configs.content`，`AllowFunnel: true`）
- Funnel 入口同源覆盖前端静态与后端 API/WS（后者经 nginx 反代到 `BACKEND_UPSTREAM`）
- 节点状态存于各 project 独立具名卷 `star-ecom-erp-<env>_tailscale-state`，重启不重新认证
- 三个节点在管理台 Machines 中以 `star-ecom-erp-main/test/dev` 出现，tag 为 `tag:erp-funnel-xq`

## 一次性配置

### 1. Tailscale 后台（tail08f53.ts.net）

1. Access controls：

   ```json
   "tagOwners": {
     "tag:github-actions-xq": ["autogroup:admin"],
     "tag:erp-funnel-xq": ["autogroup:admin"]
   },
   "nodeAttrs": [
     {
       "target": ["tag:erp-funnel-xq"],
       "attr": ["funnel"]
     }
   ]
   ```

   - `tag:github-actions-xq`：CI 临时节点（已有）
   - `tag:erp-funnel-xq`：三个环境的 Funnel 常驻节点
   - `nodeAttrs` 的 `funnel` attr 是 Funnel 总开关，即使默认全通 ACL 也必须加，否则 Funnel 一律拒绝

2. 确认 MagicDNS 与 HTTPS 证书已启用（Machines 页面；CI 已在用 MagicDNS 域名，通常已开）。

3. Settings → OAuth clients → 新建：scopes 勾选 `auth_keys`（write），tags 选 `tag:github-actions-xq`。记录生成的 client ID 与 secret。注意管理台存在 OAuth client Tags 被静默丢弃的 bug（tailscale#19945），保存后务必回看确认。

4. Settings → Keys → Generate auth key，**生成 3 个**（main / test / dev 各一个）：

   - Reusable（状态卷丢失后可重新入网）
   - Tags：`tag:erp-funnel-xq`（tag 随 key 下发，节点无需 advertise）
   - 三个 key 分别填入 GitHub 对应 Environment 的 secret（见下节）

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

除上表外，还需配置 **Environment secret**（不是 repo secret）：Settings → Environments → 分别进入 main / test / dev → Add secret：

| Environment | Secret 名称  | 值                             |
| ----------- | ------------ | ------------------------------ |
| main        | `TS_AUTHKEY` | main 环境的 Tailscale auth key |
| test        | `TS_AUTHKEY` | test 环境的 Tailscale auth key |
| dev         | `TS_AUTHKEY` | dev 环境的 Tailscale auth key  |

deploy job 带 `environment: ${{ github.ref_name }}`，运行时自动解析到对应环境的值；未配置时部署直接报错中止（`environment secret TS_AUTHKEY is required`）。

### 3. 服务器一次性准备

- Docker + compose plugin 可用（`docker compose version`）；**compose 插件需 ≥ v2.23.1**（compose 文件使用 `configs.content` 内联 serve 配置）；CPU 架构需为 x86_64（镜像按 amd64 构建）；部署用户在 `docker` 组（无需 sudo 执行 docker）。
- Funnel sidecar 镜像来自 docker.io（`tailscale/tailscale:stable`），确认服务器可访问 docker.io（此前仅拉取过 GHCR）；不通则配置 registry mirror 或预先拉取导入。
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
- **手动部署**：Actions → CI → Run workflow → 选分支（仅 main/test/dev 触发部署）。
- **切换后端 upstream**：编辑 `.github/workflows/ci.yml` deploy job 中对应分支的 `BACKEND_UPSTREAM`（如切 `host.docker.internal:8022`），合并后下次部署生效；该值只影响运行时反代，无需重建镜像。
- **回滚**：SSH 到服务器，将 `<目录>/.env` 的 `IMAGE_TAG` 改为旧构建的 sha tag，然后 `docker compose up -d`。注意 CI 下次部署会覆盖回分支 tag。
- **验证 Funnel**：`curl -I https://star-ecom-erp-<env>.tail08f53.ts.net/`（公网可达，无需在 tailnet 内）；节点首次入网后证书签发可能有几十秒到几分钟延迟。
- **关闭节点 key 过期**：三个节点首次入网后，在管理台 Machines 中对 `star-ecom-erp-main/test/dev` 关闭 Key expiry，避免约 180 天后节点 key 到期要求重新认证。
- **更换 auth key**：正常情况无需更换（持久状态不会重复认证）。仅当某环境状态卷丢失需重新入网时：更新对应 Environment 的 `TS_AUTHKEY` → SSH 到服务器执行 `docker compose -f <目录>/docker-compose.yml down && docker volume rm star-ecom-erp-<env>_tailscale-state` → 重新部署。
- **关闭某环境 Funnel**：ACL 中删除 `nodeAttrs` 对 `tag:erp-funnel-xq` 的 `funnel` attr（全量关闭），或单环境：SSH 到服务器后 `docker compose -f <目录>/docker-compose.yml stop tailscale`。
- **查看日志**：`docker compose -f /home/edward/star-ecom-erp/<分支>/docker-compose.yml logs -f web`；sidecar 日志把 `web` 换成 `tailscale`。

## 故障排查

| 症状 | 排查 |
| --- | --- |
| `DEPLOY_HOST is required` | 仓库 variable 未配置 |
| Join tailnet 报 `requested tags [...] are invalid or not permitted` | `.github/workflows/ci.yml` 的 `tags:` 与 OAuth client 实际 tag 不一致；以 OAuth client 的 Tags 为准同步 workflow |
| SSH 连接超时/拒绝 | 服务器是否在线；OAuth client 标签是否在 ACL 中有权访问 22 端口 |
| 健康检查 60s 超时但容器正常 | 服务器防火墙是否放行 tailscale 接口访问 8010-8012 |
| pull 失败 | GHCR 包可见性是否仍为 public；tag 是否已由 push-image 推送 |
| 部署报 `environment secret TS_AUTHKEY is required` | 对应 Environment（main/test/dev）未配置 `TS_AUTHKEY` secret |
| tailscale 容器重启循环，日志报认证失败 | key 失效或生成时选了一次性；换成 Reusable key 并更新对应 Environment secret |
| Funnel 域名连接被拒/超时，tailnet 内直连正常 | ACL 缺 `nodeAttrs` 的 `funnel` attr，或节点 tag 不是 `tag:erp-funnel-xq` |
| Funnel 返回证书错误 | 等待 Let's Encrypt 签发完成（首次可达数分钟）；确认 tailnet HTTPS 证书已启用 |
| `docker compose up` 报 `content` 相关配置错误 | 服务器 compose 插件 < v2.23.1，升级 docker-compose-plugin |
| 仅 `tailscale/tailscale` 镜像拉取失败 | 服务器到 docker.io 的网络问题，配 registry mirror 或预拉取 |
| 页面可开但 API 全部 502 | `BACKEND_UPSTREAM` 指向的后端不可达：后端进程/端口、宿主机防火墙，或 web 服务缺 `host.docker.internal:host-gateway` |
| 页面可开但 WebSocket 连不上 | nginx `/infra/ws` 的 Upgrade/Connection 头缺失；检查 default.conf.template 渲染产物（`docker compose exec web cat /etc/nginx/conf.d/default.conf`） |
