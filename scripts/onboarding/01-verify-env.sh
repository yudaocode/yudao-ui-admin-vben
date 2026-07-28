#!/bin/bash
# 文件名：01-verify-env.sh
# 用途：验证本地开发环境是否满足 Vben v5 要求

echo "========== 环境验证 =========="

# 验证 Node.js 版本
echo ""
echo "[1] Node.js 版本检查（要求 >= v22.18.0）"
NODE_VERSION=$(node -v | sed 's/v//')
echo "    当前版本: $(node -v)"

# 验证 Git
echo ""
echo "[2] Git 版本检查"
echo "    当前版本: $(git --version)"

# 验证 corepack
echo ""
echo "[3] Corepack 状态检查"
if command -v corepack &> /dev/null; then
    echo "    Corepack 已安装: $(corepack --version)"
    echo "    （如 pnpm 命令不可用，执行 corepack enable 启用 shims）"
else
    echo "    [错误] Corepack 未安装，请执行: npm i -g corepack"
fi

# 验证 pnpm
echo ""
echo "[4] pnpm 可用性检查"
if command -v pnpm &> /dev/null; then
    echo "    pnpm 可用: $(pnpm -v)"
else
    echo "    [警告] pnpm 命令不可用，进入项目目录后 corepack 会自动解析"
fi

echo ""
echo "========== 验证完毕 =========="
