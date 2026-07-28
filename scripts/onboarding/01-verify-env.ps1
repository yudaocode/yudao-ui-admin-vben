# 文件名：01-verify-env.ps1
# 用途：验证本地开发环境是否满足 Vben v5 要求

Write-Host "========== 环境验证 ==========" -ForegroundColor Cyan

# 验证 Node.js 版本
Write-Host ""
Write-Host "[1] Node.js 版本检查（要求 >= v22.18.0）" -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "    当前版本: $nodeVersion"

# 验证 Git
Write-Host ""
Write-Host "[2] Git 版本检查" -ForegroundColor Yellow
Write-Host "    当前版本: $(git --version)"

# 验证 corepack
Write-Host ""
Write-Host "[3] Corepack 状态检查" -ForegroundColor Yellow
if (Get-Command corepack -ErrorAction SilentlyContinue) {
    Write-Host "    Corepack 已安装: $(corepack --version)"
} else {
    Write-Host "    [错误] Corepack 未安装，请执行: npm i -g corepack" -ForegroundColor Red
}

# 验证 pnpm
Write-Host ""
Write-Host "[4] pnpm 可用性检查" -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Write-Host "    pnpm 可用: $(pnpm -v)"
} else {
    Write-Host "    [警告] pnpm 命令不可用，进入项目目录后 corepack 会自动解析" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "========== 验证完毕 ==========" -ForegroundColor Cyan
