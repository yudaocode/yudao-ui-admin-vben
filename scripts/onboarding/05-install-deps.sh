#!/bin/bash
# 文件名：05-install-deps.sh
# 用途：安装项目依赖
# 运行位置：仓库父目录（脚本内 cd 进入仓库）

cd yudao-ui-admin-vben

echo "========== 安装项目依赖 =========="
echo ""
echo "[重要] 必须使用 pnpm 安装，不支持 npm / yarn"
echo ""

# 安装依赖
pnpm install

if [ $? -eq 0 ]; then
    echo ""
    echo "========== 依赖安装完成 =========="
    echo "下一步：pnpm dev:antd"
else
    echo ""
    echo "========== 依赖安装失败 =========="
    echo "常见原因："
    echo "  1. Node.js 版本不满足要求（需要 >= v22.18.0）"
    echo "  2. 路径包含中文/日文/韩文/空格（Windows 用户特别注意）"
    echo "  3. 网络问题，尝试配置 npm 镜像：pnpm config set registry https://registry.npmmirror.com"
    exit 1
fi
