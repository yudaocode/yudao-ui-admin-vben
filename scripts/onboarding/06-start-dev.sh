#!/bin/bash
# 文件名：06-start-dev.sh
# 用途：直接启动 web-antd 开发服务器
# 运行位置：仓库父目录（脚本内 cd 进入仓库）

cd yudao-ui-admin-vben

echo "========== 启动开发服务器 =========="
echo ""
echo "正在启动 @vben/web-antd ..."
echo "启动后访问: http://localhost:5666"
echo ""
echo "默认登录账号:"
echo "  用户名: admin"
echo "  密码:   admin123"
echo ""

pnpm dev:antd
