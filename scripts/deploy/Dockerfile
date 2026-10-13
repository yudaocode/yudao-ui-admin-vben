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

# 后端地址在构建期注入 .env.production（与 deploy.yml 的 sed 模式一致）；
# VITE_GLOB_API_URL 未显式指定时跟随 VITE_BASE_URL
# ARG 须在 install 之后声明：ARG 值参与其后 RUN 层缓存键，提前声明换地址即失效
ARG VITE_BASE_URL=http://127.0.0.1:48080
ARG VITE_GLOB_API_URL=${VITE_BASE_URL}/admin-api

# 注入后端地址后构建
RUN sed -i "s#VITE_BASE_URL\s*=.*#VITE_BASE_URL=${VITE_BASE_URL}#g" ./apps/web-antd/.env.production \
    && sed -i "s#VITE_GLOB_API_URL\s*=.*#VITE_GLOB_API_URL=${VITE_GLOB_API_URL}#g" ./apps/web-antd/.env.production \
    && pnpm run build --filter=@vben/web-antd

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

# 配置 nginx
RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf \
    && rm -rf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
