#!/usr/bin/env bash
#
# CardShopDir 自动部署脚本
#
# 用法:
#   ./deploy.sh              # 从 git pull 到 pm2 重启，全流程
#   ./deploy.sh --no-pull    # 跳过 git pull（已手动拉取代码）
#   ./deploy.sh --migrate    # 额外运行数据库迁移
#   ./deploy.sh --seed       # 额外运行种子数据导入
#
# 在 VPS 上执行，建议放在 /var/www/cardshopdir-workspace/deploy.sh
# 代码 push 后，SSH 到 VPS 执行: cd /var/www/cardshopdir-workspace && ./deploy.sh
#

set -euo pipefail

# ── 配置 ────────────────────────────────────────────────────────
APP_NAME="cardshopdir"
APP_PORT=3030
APP_DIR="/var/www/cardshopdir-workspace/cardshopdir"
WORKSPACE_DIR="/var/www/cardshopdir-workspace"
DB_NAME="cardshopdir_prod"
DB_USER="cardshopdir"
DB_PASS="Bingwu718"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARN:${NC} $*"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $*" >&2; }

# 解析参数
DO_PULL=true
DO_MIGRATE=false
DO_SEED=false
for arg in "$@"; do
  case $arg in
    --no-pull)  DO_PULL=false ;;
    --migrate)  DO_MIGRATE=true ;;
    --seed)     DO_SEED=true ;;
    --help|-h)
      echo "Usage: ./deploy.sh [--no-pull] [--migrate] [--seed]"
      echo ""
      echo "Options:"
      echo "  --no-pull   Skip git pull (code already updated)"
      echo "  --migrate   Run drizzle-kit migrate after pull"
      echo "  --seed      Run seed scripts (games + shops)"
      echo "  --help      Show this help"
      exit 0
      ;;
    *) err "Unknown argument: $arg"; exit 1 ;;
  esac
done

# ── 前置检查 ────────────────────────────────────────────────────
log "=== CardShopDir Deploy ==="

if [[ ! -d "$APP_DIR" ]]; then
  err "App directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

# 检查 .env 文件
if [[ ! -f ".env" ]]; then
  err ".env file not found. Run: cp .env.prod .env"
  exit 1
fi

# ── 1. Git Pull ─────────────────────────────────────────────────
if $DO_PULL; then
  log "1/6 Pulling latest code..."
  cd "$WORKSPACE_DIR"
  git pull origin main
  cd "$APP_DIR"
  log "  ✓ Code updated"
else
  log "1/6 Skipping git pull (--no-pull)"
fi

# ── 2. 安装依赖 ─────────────────────────────────────────────────
log "2/6 Installing dependencies..."
bun install --frozen-lockfile 2>/dev/null || bun install
log "  ✓ Dependencies installed"

# ── 3. 数据库迁移（可选）─────────────────────────────────────────
if $DO_MIGRATE; then
  log "3/6 Running database migration..."
  bun run drizzle-kit generate 2>/dev/null || true
  bun run drizzle-kit migrate
  log "  ✓ Migration complete"
else
  log "3/6 Skipping migration (use --migrate to enable)"
fi

# ── 4. 种子数据（可选）──────────────────────────────────────────
if $DO_SEED; then
  log "4/6 Seeding data..."
  bun run scripts/seed-games.ts
  bun run scripts/seed-shops.ts
  log "  ✓ Seed data imported"
else
  log "4/6 Skipping seed (use --seed to enable)"
fi

# ── 5. 构建 ─────────────────────────────────────────────────────
log "5/6 Building application..."
# 清理旧构建缓存
rm -rf .next/cache 2>/dev/null || true
bun run build
log "  ✓ Build complete"

# ── 6. PM2 重启 ─────────────────────────────────────────────────
log "6/6 Restarting PM2 process..."

# 检查是否已有 PM2 进程
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
  log "  ✓ PM2 process restarted"
else
  pm2 start "bun run start --port $APP_PORT" --name "$APP_NAME"
  pm2 save
  warn "  ✓ PM2 process created (first time)"
fi

# 等待应用启动
log "Waiting for application to start..."
sleep 3

# 健康检查
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$APP_PORT" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    log "  ✓ Health check passed (HTTP $HTTP_CODE)"
    break
  fi
  if [[ $i -eq 5 ]]; then
    warn "  Health check returned HTTP $HTTP_CODE after 5 attempts"
    warn "  Check logs: pm2 logs $APP_NAME --lines 30 --nostream"
  else
    log "  Attempt $i: HTTP $HTTP_CODE, retrying in 2s..."
    sleep 2
  fi
done

# ── 完成 ────────────────────────────────────────────────────────
log ""
log "=== Deploy Complete ==="
log "  URL:          https://cardshopdir.com"
log "  Local port:   http://127.0.0.1:$APP_PORT"
log "  PM2 name:     $APP_NAME"
log ""
log "  Logs:         pm2 logs $APP_NAME"
log "  Status:       pm2 status"
log "  Nginx reload: systemctl reload nginx (if needed)"
