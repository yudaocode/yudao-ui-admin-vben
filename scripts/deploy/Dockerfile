FROM node:22-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai
ENV CI=true

# 后端地址在构建期注入 .env.production（与 deploy.yml 的 sed 模式一致）；
# VITE_GLOB_API_URL 未显式指定时跟随 VITE_BASE_URL
ARG VITE_BASE_URL=http://127.0.0.1:48080
ARG VITE_GLOB_API_URL=${VITE_BASE_URL}/admin-api

RUN npm i -g corepack && corepack enable

WORKDIR /app

# copy package.json and pnpm-lock.yaml to workspace
COPY . /app

# 安装依赖（pnpm@11.16.0 由 package.json 的 packageManager 字段解析）
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

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
