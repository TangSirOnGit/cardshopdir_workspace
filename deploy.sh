#!/usr/bin/env bash
#
# CardShopDir 自动部署脚本
#
# 用法 (在 VPS 上执行):
#   ./deploy.sh                # git pull → 安装依赖 → 构建 → PM2 重启
#   ./deploy.sh --no-pull      # 跳过 git pull（已手动拉取代码）
#   ./deploy.sh --migrate      # 额外运行数据库迁移
#   ./deploy.sh --seed         # 额外运行种子数据导入
#   ./deploy.sh --force        # 即使无代码变更也强制重新构建
#   ./deploy.sh --build-only   # 跳过 git pull，只构建+重启
#
# ── 本地一键部署（在 Mac 上执行）─────────────────────────────────
#   git push && ssh -i ~/.ssh/id_hostinger root@31.220.31.224 \
#     "cd /root/websites/cardshopdir_workspace && ./deploy.sh"
#
# 前提: VPS 已克隆仓库且配置好 GitHub SSH key 和 .env 文件
#

set -euo pipefail

# ── 配置 ────────────────────────────────────────────────────────
APP_NAME="cardshopdir"
APP_PORT=3030
APP_DIR="/root/websites/cardshopdir_workspace/cardshopdir"
WORKSPACE_DIR="/root/websites/cardshopdir_workspace"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARN:${NC} $*"; }
err()  { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $*" >&2; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $*"; }

# 解析参数
DO_PULL=true
DO_MIGRATE=false
DO_SEED=false
FORCE_BUILD=false
for arg in "$@"; do
  case $arg in
    --no-pull)    DO_PULL=false ;;
    --migrate)    DO_MIGRATE=true ;;
    --seed)       DO_SEED=true ;;
    --force)      FORCE_BUILD=true ;;
    --build-only) DO_PULL=false ;;
    --help|-h)
      echo "Usage: ./deploy.sh [--no-pull] [--migrate] [--seed] [--force] [--build-only]"
      echo ""
      echo "Options:"
      echo "  --no-pull    Skip git pull (code already updated)"
      echo "  --migrate    Run db:migrate after pull"
      echo "  --seed       Run seed scripts (games + shops)"
      echo "  --force      Rebuild even if no code changes"
      echo "  --build-only Skip git pull, just build + restart"
      echo "  --help       Show this help"
      exit 0
      ;;
    *) err "Unknown argument: $arg"; exit 1 ;;
  esac
done

# ── 前置检查 ────────────────────────────────────────────────────
log "=== CardShopDir Deploy ==="

if [[ ! -d "$WORKSPACE_DIR/.git" ]]; then
  err "Not a git repository: $WORKSPACE_DIR"
  err "Clone first: cd /root/websites && git clone git@github.com:TangSirOnGit/cardshopdir_workspace.git"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  err "App directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  err ".env file not found in $APP_DIR"
  err "Run: cp .env.prod .env  (then edit if needed)"
  exit 1
fi

# ── 1. Git Pull ─────────────────────────────────────────────────
CODE_CHANGED=true
if $DO_PULL; then
  log "1/6 Pulling latest code..."
  cd "$WORKSPACE_DIR"

  # 记录 pull 前的 commit
  OLD_SHA=$(git rev-parse HEAD 2>/dev/null || echo "none")

  if git pull --ff-only origin main; then
    NEW_SHA=$(git rev-parse HEAD 2>/dev/null || echo "none")
    if [[ "$OLD_SHA" == "$NEW_SHA" ]]; then
      info "  • Already up to date (no changes)"
      CODE_CHANGED=false
    else
      log "  ✓ Code updated: $OLD_SHA → $NEW_SHA"
    fi
  else
    err "git pull failed! Check GitHub SSH key or network."
    err "Test: ssh -T git@github.com  (should say 'Hi TangSirOnGit!')"
    exit 1
  fi
  cd "$APP_DIR"
else
  log "1/6 Skipping git pull (--no-pull)"
fi

# 无变更且未强制 → 跳过构建
if ! $CODE_CHANGED && ! $FORCE_BUILD; then
  info ""
  info "No code changes detected. Use --force to rebuild anyway."
  log "=== Deploy Skipped (already up to date) ==="
  exit 0
fi

# ── 2. 安装依赖 ─────────────────────────────────────────────────
log "2/6 Installing dependencies..."
if bun install --frozen-lockfile 2>/dev/null; then
  log "  ✓ Dependencies installed (from lockfile)"
else
  warn "  • Lockfile install failed, trying regular install..."
  bun install
  log "  ✓ Dependencies installed"
fi

# ── 3. 数据库迁移（可选）─────────────────────────────────────────
if $DO_MIGRATE; then
  log "3/6 Running database migration..."
  bun run db:generate 2>/dev/null || true
  bun run db:migrate
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

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
  log "  ✓ PM2 process restarted"
else
  pm2 start "bun run start --port $APP_PORT" --name "$APP_NAME"
  pm2 save
  warn "  ✓ PM2 process created (first time)"
  info "  • Enable auto-start: pm2 startup  (run the command it prints)"
fi

# 等待应用启动
log "Waiting for application to start..."
sleep 3

# 健康检查
HEALTH_OK=false
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:$APP_PORT" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    log "  ✓ Health check passed (HTTP $HTTP_CODE)"
    HEALTH_OK=true
    break
  fi
  if [[ $i -eq 5 ]]; then
    warn "  Health check returned HTTP $HTTP_CODE after 5 attempts"
    warn "  Check logs: pm2 logs $APP_NAME --lines 30 --nostream"
  else
    info "  Attempt $i: HTTP $HTTP_CODE, retrying in 2s..."
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
