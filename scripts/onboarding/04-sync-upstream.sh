#!/bin/bash
# 文件名：04-sync-upstream.sh
# 用途：定期同步 yudao 官方上游更新（建议每 2 周一次）
# 运行位置：仓库根目录

echo "========== 上游同步 =========="

# 1. 切换到 upstream-sync 分支（不存在则创建）
echo ""
echo "[1] 切换到 upstream-sync 分支"
git checkout upstream-sync 2>/dev/null || git checkout -b upstream-sync

# 2. 拉取上游最新代码
echo ""
echo "[2] 拉取 upstream 最新代码"
git fetch upstream

# 3. 合并上游 master
echo ""
echo "[3] 合并 upstream/master 到 upstream-sync"
git merge upstream/master

# 4. 如有冲突，提示用户手动解决
if [ $? -ne 0 ]; then
    echo ""
    echo "    [!] 存在合并冲突，请手动解决后继续"
    echo "    解决冲突后执行:"
    echo "      git add ."
    echo "      git commit -m 'chore: sync upstream $(date +%Y-%m-%d)'"
    echo "      git push origin upstream-sync"
    exit 1
fi

# 5. 推送同步结果
echo ""
echo "[4] 推送 upstream-sync 到 origin"
git push origin upstream-sync

# 6. 将更新合入 main
echo ""
echo "[5] 将 upstream-sync 合入 main"
git checkout main
git merge upstream-sync

if [ $? -ne 0 ]; then
    echo "    [!] 合入 main 时存在冲突，请手动解决"
    exit 1
fi

echo ""
echo "[6] 推送 main 到 origin"
git push origin main

echo ""
echo "========== 同步完成 =========="
