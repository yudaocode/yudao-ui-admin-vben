#!/bin/bash
# 文件名：03-setup-upstream.sh
# 用途：为已有仓库添加 upstream 远程
# 运行位置：仓库根目录

# 检查是否已存在 upstream
if git remote get-url upstream 2>/dev/null; then
    echo "upstream 远程已存在: $(git remote get-url upstream)"
else
    echo "添加 upstream 远程仓库..."
    git remote add upstream https://github.com/yudaocode/yudao-ui-admin-vben.git
    echo "upstream 已添加: https://github.com/yudaocode/yudao-ui-admin-vben.git"
fi

echo ""
echo "当前远程配置："
git remote -v
