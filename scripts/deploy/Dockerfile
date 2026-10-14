FROM node:22-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai
ENV CI=true

RUN npm i -g corepack && corepack enable

WORKDIR /app

# 先只拷依赖清单:lockfile 不变时 fetch 层跨 run/跨分支命中,install 退化为纯链接。
# pnpm-workspace.yaml 必须带头:catalogs 定义在里面,缺失会触发
# ERR_PNPM_LOCKFILE_CONFIG_MISMATCH;fetch 不能用 --mount=type=cache(cache-mount
# 不随 CACHED 层回放,新 builder 上 store 为空会让 --offline 安装失败)
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

# copy source to workspace
COPY . /app

# 安装依赖（pnpm@11.16.0 由 package.json 的 packageManager 字段解析;包已由 fetch 层就位）
RUN pnpm install --frozen-lockfile --offline

# 同源化：后端地址不再构建期注入，前端全部走相对路径，
# 由 nginx 运行时经 BACKEND_UPSTREAM 反代（见 scripts/deploy/default.conf.template）
RUN pnpm run build --filter=@vben/web-antd

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

# 主配置 + 反代模板：entrypoint 的 envsubst 渲染模板到 conf.d/default.conf，
# BACKEND_UPSTREAM 由 compose 注入（stock default.conf 被同名渲染产物覆盖，无需删除）
COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/scripts/deploy/default.conf.template /etc/nginx/templates/default.conf.template

# 复制构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
