# AGENTS.md — 芋道前端（yudao-ui-admin-vben）

本文件供 Cursor Agent 处理本仓库时作为知识库入口。细则见 `.cursor/rules/`。

## 项目身份

- 名称：芋道管理后台 Vben 版
- 路径：`D:\yudao-ui-admin-vben`
- 技术：Vue3 + Vben Admin 5.7.0 monorepo（pnpm + turbo）
- 配对后端：`D:\ruoyi-vue-pro`（端口 48080，`/admin-api`）

## 推荐工作面

优先 `apps/web-ele`（Element Plus）：

```bash
pnpm install
pnpm dev:ele
```

- 前端端口：5777
- `VITE_BASE_URL=http://127.0.0.1:48080`

## 目录要点

- `apps/web-*`：多 UI 壳
- `packages/`：共享能力
- `apps/web-ele/src/api` + `src/views`：业务按域划分（system/erp/crm/mall…）

## Agent 行为

1. 未指定 UI 壳时默认改 `web-ele`
2. 新接口先写 `api` 再写 `views`
3. 与后端模块开关保持一致，勿依赖未启用模块的接口
4. 包管理只用 pnpm；Node ≥ 22.18
5. 文档：https://doc.iocoder.cn/quick-start/
