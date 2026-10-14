# CI/CD 与部署架构复刻指南（Spring Boot 版）

参照物：本仓库（Star E-Commerce ERP `web-antd`）2026-10 成型的 CI/CD 与部署体系。目标：把同一套结构复刻到一个 Spring Boot 项目——后端**独立部署**（自持 CI/CD、compose、端口、Funnel、secrets），前端仓库仅通过 nginx 同源反代接入。

- 第一部分：现有架构总结（as-built，流水线骨架的蓝本；构建期烘焙 URL 已随同源反代改造移除，PR #20 已合并进 dev）
- 第二部分：Spring Boot 复刻指南（独立拓扑 + 前端反代对接 + 可直接落地的模板 + 一次性配置清单）

> 2026-10-14 决策：前后端完全解耦——前端做同源反向代理（upstream 经 `BACKEND_UPSTREAM` 注入），后端走自己的 CI/CD；单栈一体方案因"后端配置出现在前端仓库，耦合过高"被否。

---

## 第一部分 现有架构总结

### 1.1 全链路总览

```text
push main/test/dev ─┐
                    ├─→ checks（matrix，fail-fast）
PR（任意目标分支） ─┘     ├─ Lint          （并行）
                          ├─ Test          （并行）
                          └─ Docker Build  （并行，只构建不推送，写 GHCR buildcache）
                               ↓
                          ci-ok（聚合判定，任一腿失败即红）
                               ↓  仅非 PR 事件
                          push-image（从 buildcache 组装并推送 GHCR）
                               ↓  仅 push 到 main/test/dev
                          deploy（Tailscale 加入 tailnet → SSH → docker compose pull/up -d → 健康检查）
                               ↓
                          notify（WeCom 群通知，PR 运行与 push 运行分流到不同群）

PR 生命周期事件 → wecom-pr.yml（独立 workflow，推送 PR 群）
```

### 1.2 分支模型与触发规则

| 分支 | 角色 | CI 行为 |
| --- | --- | --- |
| `main` | 默认分支 / 生产 | push 触发全链路；`latest` tag 仅从 main 打出 |
| `test` | 测试环境 | push 触发全链路 |
| `dev` | 开发分支 | push 触发全链路；同时接收直接提交与 PR 合并 |
| PR | 任意目标分支 | `pull_request` 全局触发，止于 ci-ok，**不推送镜像、不部署** |

- main/test 正常只经 merge/PR 进代码；`workflow_dispatch` 可手动触发（选到非部署分支时自动跳过 deploy）。
- 分支保护：目标分支要求 PR + `CI OK` 检查通过。
- 注意 `test` 分支名会阻塞所有 `test/...` 形式的分支名（git ref 冲突），功能分支用 `fix/` `feat/` `ci/` 等前缀。

### 1.3 CI 流水线结构（ci.yml）

1. **checks 是一个 matrix job**（三条腿：Lint / Test / Docker Build，`strategy.fail-fast: true`）。任一腿失败立即取消其余两条腿——GitHub 没有 job 级取消 API，matrix 是唯一能原生实现「兄弟腿互取消」的方式。腿名通过 `name: ${{ matrix.name }}` 原样渲染，分支保护只需引用聚合检查 `CI OK`。
2. **ci-ok** 带 `if: !cancelled()`：上游失败仍执行判定、输出显式红叉；整跑被并发取消时跳过（防止「取消态」被判为通过而放行 push-image）。
3. **push-image**（`needs: ci-ok`，仅非 PR 事件）：`push: true`，**只读不写缓存**，从 registry buildcache 组装层后推送 GHCR。镜像只有在 CI 全绿后才进 registry。
4. **deploy**（`needs: push-image`，仅 main/test/dev）：见 §1.6。
5. **notify**（`if: !cancelled()`）：内联在 ci.yml 而非独立 `workflow_run` workflow——`workflow_run` 只从默认分支触发，PR 合并进 dev 时会永久休眠；内联则 PR 分支立即生效。按事件类型分流两个 webhook（PR 群 / Actions 群），并附失败 job 名单与整跑耗时；消息标题自报「前端」端别（与后端仓库的「后端」通知区分），部署成功时附 Funnel 访问链接（deploy job 的 `funnel_url` 输出）。
6. **concurrency** 按 ref 分组 + `cancel-in-progress: true`：同一分支连续 push 只跑最新一次，且因为流水线会发布镜像，必须防并发写 tag 竞争。

### 1.4 镜像构建与缓存（Dockerfile + registry buildcache）

多阶段构建：builder（Node/pnpm/vite build）→ production（nginx 托管静态产物 + 同源反代）。

**依赖层拆分**（缓存命中的关键）：

```dockerfile
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch            # 依赖清单不变时，此层跨 run / 跨分支命中
COPY . /app
RUN pnpm install --frozen-lockfile --offline
```

**缓存走 GHCR registry 而非 gha cache**：

- `cache-to: type=registry,ref=<IMAGE>:buildcache,mode=max`（docker-build 腿写）
- `cache-from: type=registry,ref=<IMAGE>:buildcache` + `type=gha` 兜底读
- 原因：**GitHub Actions Cache 按 branch 隔离**（PR 缓存落在 `refs/pull/N/merge`，对 dev/test 不可见），PR 构建永远无法为 dev 构建预热；registry 上的 buildcache 镜像没有这个 ACL，跨分支共享。实测二次构建 Docker 腿从 3m50s 降到 25s。
- docker-build 腿因此持有 GHCR 登录 + `packages: write`（尽管 `push: false`）。
- 同源化改造后无 build args，docker-build 与 push-image 的缓存契约自动满足。

**tag 策略**：每次 push 打 `分支名` + `完整 sha`；`:latest` 仅从 main；PR ref（形如 `10/merge`）中的 `/` 需 sanitize 成 `-`（build-push-action 即使不推送也校验 tag 合法性）。

### 1.5 运行时编排（docker-compose.yml）

- 仓库根的 `docker-compose.yml` 全部由 `.env` 参数化：`IMAGE_TAG` / `HOST_PORT` / `CONTAINER_NAME` / `COMPOSE_PROJECT_NAME` / `TS_AUTHKEY` / `TS_HOSTNAME` / `BACKEND_UPSTREAM`，`pull_policy: always`。
- **服务器上的 compose 文件与 .env 由 CI 每次部署覆盖同步，仓库是唯一事实源**，禁止手改。
- 本地从零构建走 `docker-compose.build.yml` overlay（覆盖 image + pull_policy）。

### 1.6 自动部署（Tailscale SSH）

`deploy` job 链路：

1. `tailscale/github-action@v4` 用 OAuth client（secrets `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_SECRET`）加入 tailnet，ephemeral 节点，`tags: tag:github-actions-xq`，跑完自动离网。
2. 解析部署目标（缺 repo variable 直接报错中止）：按分支映射端口 / 容器名 / Funnel 主机名 / `BACKEND_UPSTREAM`。
3. 写 `.env.deploy`（含按 Environment 解析的 `TS_AUTHKEY`，缺失即 fail-fast），scp compose 文件 + .env 到服务器目录，执行 `docker compose pull && docker compose up -d && docker image prune -f`。
4. 健康检查：CI runner 经 tailnet `curl http://<host>:<port>/`，最多 12 次 × 5s。
5. SSH 用专用 passphrase-less ed25519 key（secret `DEPLOY_SSH_KEY`），`StrictHostKeyChecking=accept-new`（WireGuard 加密链路上的 TOFU）。

**拓扑**（同一台服务器，每分支一个独立 compose project → 容器/网络/卷/端口完全隔离）：

| 分支 | 镜像 tag | 宿主机端口 | compose project | 服务器目录 |
| --- | --- | --- | --- | --- |
| main | main | 8010 | star-ecom-erp-main | /home/edward/star-ecom-erp/main |
| test | test | 8011 | star-ecom-erp-test | /home/edward/star-ecom-erp/test |
| dev | dev | 8012 | star-ecom-erp-dev | /home/edward/star-ecom-erp/dev |

**回滚**：SSH 改服务器 `.env` 的 `IMAGE_TAG` 为历史 sha tag 后 `docker compose up -d`（下次 CI 部署会覆盖回分支 tag）。

### 1.7 公网入口（Tailscale Funnel sidecar）

- compose 模板内含一个 `tailscale/tailscale:stable` sidecar，`network_mode: "service:web"` 与应用共享网络命名空间；同一模板部署三份 = 三个独立 Funnel 节点。
- Funnel：公网 443 由 tailscale 终结 TLS，代理到 `127.0.0.1:8080`（web 容器内 nginx）；serve 配置内联在 compose（`configs.content`，`AllowFunnel: true`，需 compose ≥ v2.23.1；`$${TS_CERT_DOMAIN}` 是 compose 转义，由 containerboot 替换）。
- 节点状态存于各 project 独立具名卷（`COMPOSE_PROJECT_NAME` 前缀天然隔离），重启不重新认证；节点需带 `tag:erp-funnel-xq`，ACL 中该 tag 需有 `nodeAttrs.funnel`。
- 入口形如 `https://<TS_HOSTNAME>.<tailnet>.ts.net`；同源化后 Funnel 同源覆盖前端静态与后端 API/WS（经 nginx 反代到 `BACKEND_UPSTREAM`）。

### 1.8 通知（WeCom）

- `wecom-pr.yml`：PR 生命周期（opened / reopened / ready_for_review / closed）推 PR 群，标题同样自报「前端」端别。
- ci.yml 内联 `notify` job：CI 结果（含部署结果、失败 job、耗时）按事件分流 PR 群 / Actions 群；标题自报「前端」端别，部署成功时附 Funnel 访问链接（`https://<TS_HOSTNAME>.tail08f53.ts.net`，取自 deploy job 的 `funnel_url` 输出）。版式分块：标题 / 关联对象 / 元信息（灰字引用块）/ 结果行（失败 job 橙字、部署成功绿字）/ 耗时与运行入口，仅用企微 markdown 官方支持的语法。
- webhook 存为 repo secret；未配置时告警跳过而非失败。

### 1.9 配置清单

| 层级 | 名称 | 用途 |
| --- | --- | --- |
| Repo secret | `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_SECRET` | CI 临时节点入网 |
| Repo secret | `DEPLOY_SSH_KEY` | 部署私钥（ed25519 全文） |
| Repo secret | `WECOM_PR_WEBHOOK` / `WECOM_CI_WEBHOOK` | 企微通知 |
| Repo variable | `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_PATH` | 部署目标（前两者缺失时 deploy 直接失败） |
| Environment secret（main/test/dev 各一） | `TS_AUTHKEY` | Funnel 常驻节点入网 key（Reusable + 带 tag） |
| Environment（main/test/dev） | — | deploy 按 `github.ref_name` 挂接，解析同名 vars/secrets |

> 注：同源化改造前的 `VITE_BASE_URL` / `VITE_GLOB_API_URL` repo variables 与 `environment:` 构建期门控已随 `refactor/same-origin-proxy` 分支删除。

### 1.10 关键设计决策（为什么长这样）

| 决策 | 原因 |
| --- | --- |
| matrix 三腿 + fail-fast | 兄弟腿互取消只有 matrix 能做；`CI OK` 聚合判定给分支保护引用 |
| 构建与推送分离（docker-build `push: false`，push-image `needs: ci-ok`） | 镜像只在 CI 全绿后进 registry；PR 产物不出门 |
| registry buildcache 取代 gha cache | gha cache 按 branch ACL 隔离，PR 无法预热 dev；registry 缓存跨分支共享 |
| Dockerfile 依赖层拆分 | lockfile 不变则依赖层命中 |
| 前端同源反代（`refactor/same-origin-proxy`） | 镜像环境无关、无 CORS、Funnel 一口通吃；后端位置退化为一个 `BACKEND_UPSTREAM` 地址 |
| deploy 用 SSH + compose（而非 tailscale docker context） | CI 写 .env + scp 覆盖 = 仓库单一事实源，拓扑可审计 |
| 每分支一个 compose project | 端口/容器/卷隔离，`COMPOSE_PROJECT_NAME` 一个变量即可切换环境 |
| notify 内联而非 workflow_run | workflow_run 只在默认分支触发，PR→dev 的场景会休眠 |
| TS_AUTHKEY 放 Environment secret | 按 `github.ref_name` 自动解析对应环境；PR 运行因不挂环境而拿不到部署 secret |

---

## 第二部分 Spring Boot 复刻指南

### 2.1 目标架构（后端独立部署 + 前端同源反代）

后端以自己的 compose project / 端口段 / Funnel 节点独立部署，与前端唯一的关系是「被前端 nginx 反代」：

```text
浏览器 / 前端 Funnel(443, TLS)
   → 前端 tailscale sidecar → 127.0.0.1:8080 前端 nginx
       ├─ /                  → 前端静态资源（SPA, hash 路由）
       └─ /admin-api /infra(ws) /actuator/health /druid /doc.html ...
                             → proxy → host.docker.internal:802x → 后端 compose project

后端 CI/CD（本指南）：独立 compose project，自持端口 8020-8022、Funnel（可选）、secrets
```

**前端仓库持有的后端信息只有一个地址**：ci.yml deploy case 里的 `BACKEND_UPSTREAM`（当前三环境均为 `host.docker.internal:48080`，即现有 co-located 后端）。后端新栈上线后的切换动作：把 ci.yml 中对应分支的值改为 `host.docker.internal:802x`，合并后下次部署生效，无需重建任何镜像。

后端拓扑（与前端同服务器，端口段避开 8010-8012）：

| 分支 | 镜像 tag | 宿主机端口 | compose project | 服务器目录              |
| ---- | -------- | ---------- | --------------- | ----------------------- |
| main | main     | 8020       | myapp-main      | /home/edward/myapp/main |
| test | test     | 8021       | myapp-test      | /home/edward/myapp/test |
| dev  | dev      | 8022       | myapp-dev       | /home/edward/myapp/dev  |

与前端版的差异：

| 维度 | 前端（本仓库） | Spring Boot 项目 |
| --- | --- | --- |
| 构建工具 | pnpm + vite | Maven（Gradle 同理，见 §2.8） |
| 产物 | 静态文件 → nginx 容器 | fat jar → JRE 容器 |
| 环境配置 | 运行时 env 注入（`BACKEND_UPSTREAM` 模板渲染） | 运行时 env 注入（compose `environment:` + `.env`），换配置不重建镜像 |
| 容器内端口 | 8080（nginx） | 8080（`server.port` 默认值） |
| 健康检查路径 | `/`（前端 CI） | `/actuator/health`（后端 CI，直连自己端口） |
| Funnel | 必须（前端唯一公网入口） | 可选（前端反代已覆盖 API；Funnel 仅在需要公网直达后端时开启） |

### 2.2 前端仓库前置改造（已完成，PR #20 已合并进 dev）

前端侧已完成以下动作（详见本仓库 docs/deploy.md 与 PR #20 提交）：

1. `.env.production` 同源化：`VITE_BASE_URL=`（空）、`VITE_GLOB_API_URL=/admin-api`。
2. nginx server 块拆为 `scripts/deploy/default.conf.template`，唯一变量 `${BACKEND_UPSTREAM}`，代理 `/admin-api`、`/infra/ws`（WS upgrade）、`= /actuator/health`、`/druid/`、`/doc.html`、`/webjars/`、`/v3/api-docs`、`/swagger-resources`、`/jmreport/`、`/drag/`、`/admin/`；CORS 头删除。
3. Dockerfile 删 `ARG VITE_*` + sed；compose web 服务加 `BACKEND_UPSTREAM` env 与 `host.docker.internal:host-gateway`。
4. ci.yml 删整条 build args 链路；deploy 的 case 增写 `BACKEND_UPSTREAM`（三环境当前均 `host.docker.internal:48080`）。
5. WS 消费者（`infra/webSocket`、`mall/promotion/kefu`）补 origin 回退。

**后端上线后的切换清单**：后端各环境 `docker compose ps` 健康 → 前端仓库改 ci.yml 对应分支 `BACKEND_UPSTREAM=host.docker.internal:802x` → merge → 自动部署后浏览器验证登录/API/WS。

### 2.3 Dockerfile 模板（后端仓库）

放后端仓库根目录 `Dockerfile`：

```dockerfile
# ---- 构建层 ----
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
ENV TZ=Asia/Shanghai

# 依赖层：先只拷 pom.xml 预拉依赖，pom 不变时该层跨 run/跨分支命中。
# 不要用 RUN --mount=type=cache：cache-mount 不随 CACHED 层回放，
# 换 builder 后该层虽 CACHED 但 .m2 为空，package 阶段会全量重新下载
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

# 多模块项目把上面的 COPY/RUN 换成（模块按实际清单增删，保持目录结构）：
# COPY pom.xml ./
# COPY module-common/pom.xml module-common/
# COPY module-server/pom.xml module-server/
# RUN mvn -B -q dependency:go-offline

# 拷源码打包；单测由 CI 的 Test 腿承担，此处跳过
COPY src ./src
RUN mvn -B package -DskipTests

# ---- 运行层 ----
FROM eclipse-temurin:21-jre AS production
WORKDIR /app
ENV TZ=Asia/Shanghai

# 多模块：/app/target/*.jar 换成启动模块路径，如 /app/module-server/target/*.jar
COPY --from=builder /app/target/*.jar app.jar

# JVM 参数经容器环境变量注入（compose 的 JAVA_OPTS）
ENV JAVA_OPTS=""

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 2.4 docker-compose.yml 模板（后端仓库）

放后端仓库根目录，结构与前端版同构（`.env` 参数化 + tailscale sidecar）：

```yaml
# 后端运行时编排：镜像由本仓库 CI 构建推送 GHCR；本文件与 .env 由 ci.yml deploy job 每次覆盖同步
services:
  app:
    image: ghcr.io/<owner>/<backend>:${IMAGE_TAG:-latest}
    container_name: ${CONTAINER_NAME:-myapp}
    ports:
      - '${HOST_PORT:-8020}:8080'
    restart: unless-stopped
    pull_policy: always
    environment:
      # 运行时配置注入：数据源/Redis 等按项目实际配置项以 SPRING_* 变量追加
      - SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-prod}
      - JAVA_OPTS=${JAVA_OPTS:-}
    extra_hosts:
      - 'host.docker.internal:host-gateway' # 连宿主机 MySQL/Redis 用

  # tailscale sidecar：可选。开启 = 公网 Funnel 直达后端全量接口（含 Swagger/Druid），
  # 仅建议内测使用；不需要公网直达时删掉本服务与 configs，tailnet 内 802x 仍可访问
  tailscale:
    image: tailscale/tailscale:stable
    container_name: ${CONTAINER_NAME:-myapp}-tailscale
    network_mode: 'service:app'
    depends_on:
      - app
    restart: unless-stopped
    environment:
      - TS_AUTHKEY=${TS_AUTHKEY:-}
      - TS_HOSTNAME=${TS_HOSTNAME:-myapp-main}
      - TS_AUTH_ONCE=true
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_SERVE_CONFIG=/config/serve.json
      - TS_USERSPACE=true
    volumes:
      - tailscale-state:/var/lib/tailscale
    configs:
      - source: serve
        target: /config/serve.json

# 需 docker compose ≥ v2.23.1；$${...} 为 compose 转义，字面量由 containerboot 替换
configs:
  serve:
    content: |
      {
        "TCP": { "443": { "HTTPS": true } },
        "Web": {
          "$${TS_CERT_DOMAIN}:443": {
            "Handlers": { "/": { "Proxy": "http://127.0.0.1:8080" } }
          }
        },
        "AllowFunnel": { "$${TS_CERT_DOMAIN}:443": true }
      }

volumes:
  tailscale-state:
```

### 2.5 后端 ci.yml 完整模板

与前端版骨架对称：checks（Lint/Test/Docker Build）→ ci-ok → push-image → deploy（部署自己的 project）。无 build args，docker-build 不需要 environment；deploy 挂 environment 解析 per-env `TS_AUTHKEY`。notify 与前端版唯一差异是 `APP_SIDE` 标签为「后端」；deploy 额外输出 `funnel_url`（未开启后端 Funnel 时删除对应行，notify 自动退化为只报部署结果）。

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main
      - test
      - dev
  workflow_dispatch:

permissions:
  contents: read

env:
  CI: true
  TZ: Asia/Shanghai
  IMAGE: ghcr.io/<owner>/<backend-repo> # GHCR 镜像名必须全小写

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: ${{ matrix.name }}
    runs-on: ubuntu-latest
    timeout-minutes: 40
    strategy:
      fail-fast: true
      matrix:
        include:
          - name: Lint
          - name: Test
          - name: Docker Build
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Setup Java
        if: ${{ matrix.name != 'Docker Build' }}
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Lint
        if: ${{ matrix.name == 'Lint' }}
        run: mvn -B spotless:check # 或 checkstyle:check / pmd:check，按项目实际替换

      - name: Test
        if: ${{ matrix.name == 'Test' }}
        run: mvn -B test

      - name: Compose image tags
        if: ${{ matrix.name == 'Docker Build' }}
        id: meta
        env:
          REF: ${{ github.ref_name }}
          SHA: ${{ github.sha }}
        run: |
          # PR 的 ref_name 形如 10/merge，含 '/' 非法，需 sanitize
          REF_TAG="${REF//\//-}"
          TAGS="${IMAGE}:${REF_TAG}
          ${IMAGE}:${SHA}"
          if [ "${REF}" = "main" ]; then
            TAGS="${TAGS}
          ${IMAGE}:latest"
          fi
          {
            echo 'tags<<__TAGS_EOF__'
            echo "$TAGS"
            echo '__TAGS_EOF__'
          } >> "$GITHUB_OUTPUT"

      - name: Set up Docker Buildx
        if: ${{ matrix.name == 'Docker Build' }}
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        if: ${{ matrix.name == 'Docker Build' }}
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 只构建不推送；层写入 GHCR buildcache 镜像供 push-image 复用
      - name: Build image
        if: ${{ matrix.name == 'Docker Build' }}
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: false
          cache-from: |
            type=registry,ref=${{ env.IMAGE }}:buildcache
            type=gha
          cache-to: type=registry,ref=${{ env.IMAGE }}:buildcache,mode=max
          tags: ${{ steps.meta.outputs.tags }}

  ci-ok:
    name: CI OK
    runs-on: ubuntu-latest
    needs: [checks]
    if: ${{ !cancelled() }}
    env:
      FAILURE: ${{ contains(join(needs.*.result, ','), 'failure') }}
    steps:
      - name: Check for failure
        run: |
          echo $FAILURE
          if [ "$FAILURE" = "false" ]; then exit 0; else exit 1; fi

  push-image:
    name: Push Image
    runs-on: ubuntu-latest
    timeout-minutes: 40
    needs: ci-ok
    if: ${{ github.event_name != 'pull_request' }}
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Compose image tags
        id: meta
        env:
          REF: ${{ github.ref_name }}
          SHA: ${{ github.sha }}
        run: |
          REF_TAG="${REF//\//-}"
          TAGS="${IMAGE}:${REF_TAG}
          ${IMAGE}:${SHA}"
          if [ "${REF}" = "main" ]; then
            TAGS="${TAGS}
          ${IMAGE}:latest"
          fi
          {
            echo 'tags<<__TAGS_EOF__'
            echo "$TAGS"
            echo '__TAGS_EOF__'
          } >> "$GITHUB_OUTPUT"

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 只读 buildcache 组装并推送；无 build args，与 docker-build 的缓存契约天然一致
      - name: Push image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          cache-from: |
            type=registry,ref=${{ env.IMAGE }}:buildcache
            type=gha
          tags: ${{ steps.meta.outputs.tags }}

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: push-image
    if: ${{ contains(fromJSON('["main", "test", "dev"]'), github.ref_name) }}
    environment: ${{ github.ref_name }}
    # funnel_url 供 notify 在部署成功时展示环境访问链接（deploy 被跳过时为空）
    outputs:
      funnel_url: ${{ steps.target.outputs.funnel_url }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Join tailnet
        uses: tailscale/github-action@v4
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:github-actions-xq

      - name: Resolve deploy target
        id: target
        env:
          HOST: ${{ vars.DEPLOY_HOST }}
          SSH_USER: ${{ vars.DEPLOY_USER }}
          BASE_PATH: ${{ vars.DEPLOY_PATH }}
        run: |
          : "${HOST:?repository variable DEPLOY_HOST is required}"
          : "${SSH_USER:?repository variable DEPLOY_USER is required}"
          BASE_PATH="${BASE_PATH:-/opt/myapp}"
          case "${GITHUB_REF_NAME}" in
            # 端口段避开前端的 8010-8012
            main) PORT=8020; NAME=myapp-main; TS_HOSTNAME=myapp-main ;;
            test) PORT=8021; NAME=myapp-test; TS_HOSTNAME=myapp-test ;;
            dev)  PORT=8022; NAME=myapp-dev;  TS_HOSTNAME=myapp-dev ;;
          esac
          {
            echo "host=$HOST"
            echo "user=$SSH_USER"
            echo "dir=${BASE_PATH}/${GITHUB_REF_NAME}"
            echo "port=$PORT"
            echo "name=$NAME"
            echo "tshostname=$TS_HOSTNAME"
            # Funnel 公网入口；§2.4 决定不开后端 Funnel 时删除本行，notify 将不展示访问链接
            echo "funnel_url=https://${TS_HOSTNAME}.tail08f53.ts.net"
          } >> "$GITHUB_OUTPUT"

      - name: Configure SSH
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          : "${SSH_KEY:?repository secret DEPLOY_SSH_KEY is required}"
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key

      - name: Deploy over SSH
        env:
          HOST: ${{ steps.target.outputs.host }}
          SSH_USER: ${{ steps.target.outputs.user }}
          DIR: ${{ steps.target.outputs.dir }}
          BRANCH: ${{ github.ref_name }}
          HOST_PORT: ${{ steps.target.outputs.port }}
          NAME: ${{ steps.target.outputs.name }}
          TS_HOSTNAME: ${{ steps.target.outputs.tshostname }}
          TS_AUTHKEY: ${{ secrets.TS_AUTHKEY }}
        run: |
          : "${TS_AUTHKEY:?environment secret TS_AUTHKEY is required (main/test/dev 各自配置)}"
          printf 'COMPOSE_PROJECT_NAME=%s\nIMAGE_TAG=%s\nHOST_PORT=%s\nCONTAINER_NAME=%s\nTS_HOSTNAME=%s\nTS_AUTHKEY=%s\n' \
            "$NAME" "$BRANCH" "$HOST_PORT" "$NAME" "$TS_HOSTNAME" "$TS_AUTHKEY" > .env.deploy
          SSH_OPTS="-i $HOME/.ssh/deploy_key -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
          ssh $SSH_OPTS "${SSH_USER}@${HOST}" "mkdir -p '${DIR}'"
          scp $SSH_OPTS docker-compose.yml "${SSH_USER}@${HOST}:${DIR}/docker-compose.yml"
          scp $SSH_OPTS .env.deploy "${SSH_USER}@${HOST}:${DIR}/.env"
          rm -f .env.deploy
          ssh $SSH_OPTS "${SSH_USER}@${HOST}" \
            "cd '${DIR}' && docker compose pull && docker compose up -d && docker compose ps && docker image prune -f > /dev/null"

      # 直连自己端口探测（不经前端反代）
      - name: Verify over tailnet
        env:
          HOST: ${{ steps.target.outputs.host }}
          PORT: ${{ steps.target.outputs.port }}
        run: |
          for i in $(seq 1 12); do
            if curl -fsS --max-time 5 "http://${HOST}:${PORT}/actuator/health" > /dev/null; then
              echo "OK: http://${HOST}:${PORT}/actuator/health is serving"
              exit 0
            fi
            echo "attempt $i/12 not ready, retrying in 5s..."
            sleep 5
          done
          echo "::error::health check failed after 60s"
          exit 1

  notify:
    name: WeCom Notify
    runs-on: ubuntu-latest
    timeout-minutes: 5
    needs: [ci-ok, push-image, deploy]
    # PR 运行（止于 ci-ok）推 PR 群，push/手动触发推 Actions 群；
    # 上游失败或被跳过仍要通知（否则 PR 运行永不发送）；整跑被并发取消时静默，由后继运行补发
    if: ${{ !cancelled() }}
    permissions:
      actions: read
      contents: read
    env:
      FAILURE: ${{ contains(join(needs.*.result, ','), 'failure') }}
      # 与前端仓库 notify 的唯一差异：消息标题自报「后端」，同一企微群即可区分来源
      APP_SIDE: 后端
    steps:
      - name: Send WeCom notification
        env:
          GH_TOKEN: ${{ github.token }}
          WECOM_PR_WEBHOOK: ${{ secrets.WECOM_PR_WEBHOOK }}
          WECOM_CI_WEBHOOK: ${{ secrets.WECOM_CI_WEBHOOK }}
          EVENT_NAME: ${{ github.event_name }}
          REF_NAME: ${{ github.ref_name }}
          SHA: ${{ github.sha }}
          ACTOR: ${{ github.actor }}
          HEAD_MSG: ${{ github.event.head_commit.message }}
          DEPLOY_RESULT: ${{ needs.deploy.result }}
          FUNNEL_URL: ${{ needs.deploy.outputs.funnel_url }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_URL: ${{ github.event.pull_request.html_url }}
          PR_AUTHOR: ${{ github.event.pull_request.user.login }}
          PR_HEAD: ${{ github.event.pull_request.head.ref }}
          PR_BASE: ${{ github.event.pull_request.base.ref }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail

          if [ "$EVENT_NAME" = "pull_request" ]; then
            WEBHOOK="$WECOM_PR_WEBHOOK"
          else
            WEBHOOK="$WECOM_CI_WEBHOOK"
          fi
          if [ -z "$WEBHOOK" ]; then
            echo "::warning::WeCom webhook secret not configured, skip notification"
            exit 0
          fi

          # 失败 job 名单与整跑耗时；notify 自身仍在运行、skipped job 无时间戳，均需过滤 null
          JOBS=$(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}/jobs?per_page=100" --jq '.jobs')
          FAILED=$(jq -r '[.[] | select(.conclusion == "failure") | .name] | join("、")' <<<"$JOBS")
          START=$(jq -r '[.[].started_at | select(. != null)] | min' <<<"$JOBS")
          END=$(jq -r '[.[].completed_at | select(. != null)] | max' <<<"$JOBS")
          SECS=$(( $(date -u -d "$END" +%s) - $(date -u -d "$START" +%s) ))
          DUR="$(( SECS / 60 ))m$(( SECS % 60 ))s"

          if [ "$FAILURE" = "true" ]; then
            ICON="❌"; LABEL="失败"
          else
            ICON="✅"; LABEL="成功"
          fi

          if [ "$EVENT_NAME" = "pull_request" ]; then
            HEADLINE="${APP_SIDE} PR CI ${LABEL}"
            TITLE="**[#${PR_NUMBER} ${PR_TITLE}](${PR_URL})**"
            WHO="${PR_AUTHOR} · ${PR_HEAD} → ${PR_BASE}"
          else
            SUBJECT=$(printf '%s\n' "$HEAD_MSG" | head -1)
            if [ -z "$SUBJECT" ]; then
              SUBJECT=$(gh api "repos/${GITHUB_REPOSITORY}/commits/${SHA}" --jq '.commit.message' | head -1)
            fi
            HEADLINE="${APP_SIDE} CI ${LABEL}"
            if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
              HEADLINE="${APP_SIDE} · 手动触发 CI ${LABEL}"
            fi
            TITLE="**${SUBJECT}**"
            WHO="${ACTOR} · ${REF_NAME} · ${SHA:0:8}"
          fi

          # 版式（仅用企微 markdown 支持的语法）：标题 / 关联对象 / 元信息（灰字引用块）/
          # 结果行（失败 job 橙字、部署成功绿字）/ 耗时与运行入口
          {
            echo "## ${ICON} ${HEADLINE}"
            echo ""
            echo "${TITLE}"
            echo ""
            echo "> <font color=\"comment\">👤 ${WHO}</font>"
            if [ -n "$FAILED" ]; then
              echo ""
              echo "⚠️ <font color=\"warning\">失败 job：${FAILED}</font>"
            fi
            # 后端 Funnel 为可选（§2.4），未开启时 funnel_url 输出已删，此处自动不展示链接
            if [ "$FAILURE" = "false" ] && [ "$DEPLOY_RESULT" = "success" ] && [ -n "$FUNNEL_URL" ]; then
              echo ""
              echo "🚀 <font color=\"info\">已部署 ${REF_NAME} 环境</font>　[${FUNNEL_URL}](${FUNNEL_URL})"
            fi
            echo ""
            echo "⏱ 耗时 ${DUR} · [查看运行](${RUN_URL})"
          } > /tmp/wecom-msg.md

          PAYLOAD=$(jq -Rs '{msgtype: "markdown", markdown: {content: .}}' /tmp/wecom-msg.md)
          RESP=$(curl -fsS -m 10 --retry 2 --retry-delay 2 -X POST \
            -H 'Content-Type: application/json' -d "$PAYLOAD" "$WEBHOOK")
          echo "$RESP" | jq -e '.errcode == 0' > /dev/null
          echo "WeCom notified: ${RESP}"
```

`wecom-pr.yml` 同样复制，把 `APP_SIDE` 改为「后端」。

### 2.6 一次性配置

默认与前端共用同一台服务器和同一个 tailnet（`tail08f53.ts.net`）；换服务器则把 `DEPLOY_HOST` 等换成新值。

**Tailscale 管理台**

1. ACL：`tag:github-actions-xq`（CI 节点）与 `tag:erp-funnel-xq`（Funnel 节点）的 tagOwners、`nodeAttrs.funnel` 均已存在（前端配置过），**无需改动**；后端节点复用 `tag:erp-funnel-xq`。
2. OAuth client：复用前端的（client ID/secret 是仓库级 secret，在后端仓库重新填一遍即可）。
3. Keys：**新生成 3 个** Reusable auth key（tags `tag:erp-funnel-xq`），分别填入后端仓库 main/test/dev 三个 Environment 的 `TS_AUTHKEY`。主机名 `myapp-main/test/dev` 首次入网时自动注册。若 §2.4 决定不开后端 Funnel，则此步与第 4/5 步全部跳过。

**GitHub 仓库（Settings → Secrets and variables → Actions）**

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_SECRET` | 同前端（或新建 client） |
| Secret | `DEPLOY_SSH_KEY` | 部署私钥全文（同一台服务器可直接复用前端的 keypair） |
| Secret | `WECOM_PR_WEBHOOK` / `WECOM_CI_WEBHOOK` | 企微群机器人 webhook（可复用前端的群：notify 标题自报「后端」，与前端消息可区分；也可新建群） |
| Variable | `DEPLOY_HOST` | `xq-local.tail08f53.ts.net` |
| Variable | `DEPLOY_USER` | `edward`（在 docker 组） |
| Variable | `DEPLOY_PATH` | 例 `/home/edward/myapp` |
| Environment secret ×3 | main/test/dev 各配 `TS_AUTHKEY` | 对应新 auth key |

数据源/Redis 等敏感连接配置：以 Environment secret 存放（如 `SPRING_DATASOURCE_PASSWORD`），在 deploy 的 `.env.deploy` 中随其他键一并写入（模式与 `TS_AUTHKEY` 相同），或按项目配置习惯经 `SPRING_PROFILES_ACTIVE` 指向服务器本地 profile 文件。

**分支保护**：main/test/dev 要求 PR + `CI OK`（workflow 首次在分支上跑过后才可在保护设置中搜到）。

**服务器**

- Docker + compose plugin ≥ v2.23.1、`edward` 在 docker 组、docker.io 可达——前端部署时已就绪，**无需重做**。
- 部署目录 `/home/edward/myapp/<分支>` 由 CI 自动创建。
- 依赖 actuator 健康检查：项目需引入 `spring-boot-starter-actuator`。
- **宿主机端口放行**：前端 nginx 经 host-gateway 访问 802x，确认宿主机防火墙对 docker 网桥放行（通常默认放行）。

### 2.7 上线检查清单

- [ ] 后端：Dockerfile（单模块/多模块二选一调整）、docker-compose.yml、ci.yml、wecom-pr.yml 落库
- [ ] 后端：`spring-boot-starter-actuator` 引入，本地 `/actuator/health` 可达
- [ ] 后端 GHCR 包设为 public（buildcache blob 会把私有包存储推过 500MB 免费额度）
- [ ] Tailscale：3 个新 Reusable key → 3 个 Environment 的 `TS_AUTHKEY`（若开后端 Funnel）
- [ ] Repo secrets / variables：TS_OAUTH_*、DEPLOY_SSH_KEY、DEPLOY_HOST/USER/PATH
- [ ] 分支保护：PR + `CI OK`
- [ ] 后端首次 push dev：全链路绿，服务器 `docker compose ps` 确认 app + tailscale Up
- [ ] `curl http://<host>:8022/actuator/health` 经 tailnet 直连可达
- [ ] **前端切换**：前端仓库 ci.yml 对应分支 `BACKEND_UPSTREAM` 改 `host.docker.internal:802x` → merge → 自动部署
- [ ] 浏览器（前端 Funnel/tailnet 入口）：登录 + 任一 API 页 + `/doc.html` + IM websocket
- [ ] 管理台对新节点关闭 Key expiry（若开了后端 Funnel）

### 2.8 与前端版的差异与坑

| 主题 | 说明 |
| --- | --- |
| 职责边界 | 前端仓库只感知一个 `BACKEND_UPSTREAM` 地址；后端端口/Funnel/密钥/DB 全部自持，两仓库 CI/CD 完全独立 |
| 切换后端实例 | 只改前端 ci.yml case 值（48080 → 802x），运行时反代即时生效，零镜像重建 |
| 端口规划 | 后端 8020-8022 避开前端 8010-8012；同机多项目按号段划分 |
| 后端 Funnel 的暴露面 | Funnel 直达后端 = 全量接口公网可达（含 Swagger/Druid）；默认建议不开，反代路径已覆盖前端所需 |
| actuator 暴露面 | 前端 nginx 只代理 `/actuator/health`（默认无详情）；直连 802x 时注意防火墙仅放行 docker 网桥与 tailnet 接口 |
| WebSocket 反代 | 前端 nginx `/infra/ws` 带 Upgrade/Connection 头 + `proxy_http_version 1.1`；后端侧无需感知 |
| 依赖层不要用 cache mount | `RUN --mount=type=cache` 的内容不随 CACHED 层回放，换 builder 后层显示 CACHED 但 `.m2` 为空。让依赖烘进层里、靠 registry buildcache 复用 |
| `dependency:go-offline` 覆盖率 | 不能保证 100% 拉全，但 Maven 没有 pnpm `--offline` 式强约束，缺口自动补下，只影响极少数冷构建速度 |
| 多模块 pom 拷贝 | 依赖层必须把各模块 pom 按目录结构列全，漏一个模块会降低缓存命中（不致失败） |
| Gradle 项目 | 依赖层换 `COPY build.gradle settings.gradle gradle* ./` + `gradle dependencies`，产物路径换 `build/libs/*.jar`，其余不变 |
| GHCR 镜像名 | 必须全小写，与仓库名/owner 大小写无关 |
| buildcache 存储占用 | `mode=max` 的 buildcache 镜像体积可达 GB 级，计入 GHCR 私有包 500MB 免费额度；包设 public 后存储免费，定期清理历史版本 |
| 前端踩过的坑对本项目的映射 | 「gha cache 分支隔离」→ 仍用 registry buildcache；「docker-build/push-image 缓存契约」→ 无 build args 后自动满足；「ARG 后置」→ 无对应物，天然消失；「notify 内联 / TOFU / concurrency」→ 原样保留（notify 仅 `APP_SIDE` 标签不同） |
