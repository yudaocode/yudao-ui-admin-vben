#!/bin/bash
# 文件名：02-clone-repo.sh
# 用途：Clone Fork 后的仓库并配置上游远程
# 运行位置：仓库父目录（尚未 clone 时）

# ========== 配置区（请根据实际情况修改）==========
# 替换为你的组织/用户名
ORG_NAME="你的组织或用户名"
# 项目存放路径（Windows 示例：/d/projects，macOS 示例：~/projects）
PROJECT_DIR="$HOME/projects"
# ==================================================

REPO_NAME="yudao-ui-admin-vben"
CLONE_URL="https://github.com/${ORG_NAME}/${REPO_NAME}.git"

echo "========== Clone yudao-ui-admin-vben =========="

# 创建目标目录（如果不存在）
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone 仓库
echo "[1] 正在 Clone 仓库: ${CLONE_URL}"
git clone "${CLONE_URL}"
cd "${REPO_NAME}"

# 添加上游仓库
echo ""
echo "[2] 添加上游远程仓库"
git remote add upstream https://github.com/yudaocode/yudao-ui-admin-vben.git

# 验证远程仓库配置
echo ""
echo "[3] 远程仓库配置："
git remote -v
echo ""
echo "    origin   -> 你的 Fork"
echo "    upstream -> yudao 官方"

echo ""
echo "========== Clone 完成 =========="
echo "下一步：cd ${PROJECT_DIR}/${REPO_NAME} && pnpm install"
