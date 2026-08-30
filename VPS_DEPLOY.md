# CardShopDir VPS 部署操作说明

## 前提条件

- VPS: 2核 8GB / Ubuntu 24.04 / IP: 31.220.31.224
- 已有: Postgres 16, Redis 7, Bun 1.1.34, Nginx, Certbot, PM2
- 已创建数据库: `cardshopdir_prod`（用户 `cardshopdir`，密码 `Bingwu718`）
- 域名: `cardshopdir.com`（DNS 指向 VPS IP）
- R2: `assert.cardshopdir.com`（图片 CDN，已配置）

---

## 部署步骤

### 1. 在 VPS 上克隆代码

```bash
# 假设你把代码推到了 GitHub（先在本地推）
# 或者直接 scp 上传

cd /var/www
git clone <your-repo-url> cardshopdir-workspace
cd cardshopdir-workspace/cardshopdir
```

> 如果还没有 git remote，可以用 scp：
> ```bash
> # 在本地执行
> scp -r /Users/tangsir/work/source_code/cardshopdir-workspace/cardshopdir root@31.220.31.224:/var/www/cardshopdir
> ```

### 2. 安装依赖

```bash
cd /var/www/cardshopdir
bun install
```

### 3. 配置生产环境变量

```bash
# 复制生产环境配置
cp .env.prod .env

# 验证关键配置
cat .env | grep -E "DATABASE_URL|BETTER_AUTH_URL|R2_PUBLIC_URL"
# 应该看到:
# DATABASE_URL=postgresql://cardshopdir:Bingwu718@localhost:5432/cardshopdir_prod
# BETTER_AUTH_URL=https://cardshopdir.com
# R2_PUBLIC_URL=https://assert.cardshopdir.com
```

### 4. 运行数据库迁移

```bash
# 生成迁移文件（如果还没有）
bun run drizzle-kit generate

# 推送迁移到生产数据库
bun run drizzle-kit migrate

# 验证表已创建
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "\dt"
# 应该看到 13 个表
```

### 5. 导入数据

```bash
# 导入 15 个游戏分类
bun run scripts/seed-games.ts

# 导入 7,722 家店铺
# 需要先把 data/shops_final.jsonl 传到 VPS
# 在本地执行:
# scp ../data/shops_final.jsonl root@31.220.31.224:/var/www/cardshopdir-workspace/data/

# 然后在 VPS 上执行:
bun run scripts/seed-shops.ts

# 验证数据
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "
  SELECT 'shops' as tbl, count(*) FROM shops
  UNION ALL SELECT 'games', count(*) FROM games
  UNION ALL SELECT 'shop_games', count(*) FROM shop_games
  UNION ALL SELECT 'shop_hours', count(*) FROM shop_hours;
"
# 应该看到:
#  shops | 7722
#  games | 15
#  shop_games | 17207
#  shop_hours | 27390
```

### 6. 构建应用

```bash
cd /var/www/cardshopdir
bun run build
```

> 注意: 构建时需要连接数据库（SSG 预渲染），确保 `.env` 中 `DATABASE_URL` 指向 `localhost`。

### 7. 用 PM2 启动

```bash
# 启动（端口 3002，避免与现有应用冲突）
pm2 start "bun run start" --name cardshopdir -- --port 3002

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup  # 如果还没配置过

# 验证运行
pm2 status
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3002
# 应该返回 200
```

### 8. 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
cat > /etc/nginx/sites-available/cardshopdir.com << 'EOF'
server {
    server_name cardshopdir.com www.cardshopdir.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 禁用代理缓存
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache 1;

        # 超时设置
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/cardshopdir.com /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

### 9. 申请 SSL 证书

```bash
# 用 Certbot 自动配置 HTTPS
certbot --nginx -d cardshopdir.com -d www.cardshopdir.com

# Certbot 会自动:
# - 申请 Let's Encrypt 证书
# - 修改 Nginx 配置添加 SSL
# - 设置 HTTP → HTTPS 重定向
# - 配置自动续期
```

### 10. 验证部署

```bash
# 检查 HTTP 状态
curl -sS -o /dev/null -w "%{http_code}" https://cardshopdir.com
# 应该返回 200

# 检查图片 CDN
curl -sS -o /dev/null -w "%{http_code}" https://assert.cardshopdir.com/shops/1st-capital-gaming-york-pa.jpg
# 应该返回 200（SSL 证书生效后）

# 检查 PM2 日志
pm2 logs cardshopdir --lines 20

# 检查 Nginx 日志
tail -20 /var/log/nginx/access.log
```

---

## 日常运维

### 更新代码

```bash
cd /var/www/cardshopdir
git pull origin main
bun install              # 如果依赖变了
bun run drizzle-kit migrate  # 如果 schema 变了
bun run build
pm2 restart cardshopdir
```

### 查看日志

```bash
# 应用日志
pm2 logs cardshopdir

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 数据库备份

```bash
# 手动备份
PGPASSWORD='Bingwu718' pg_dump -U cardshopdir -h localhost cardshopdir_prod > /backup/cardshopdir_$(date +%Y%m%d).sql

# 设置 cron 自动备份（每天凌晨 3 点）
crontab -e
# 添加:
# 0 3 * * * PGPASSWORD='Bingwu718' pg_dump -U cardshopdir -h localhost cardshopdir_prod > /backup/cardshopdir_$(date +\%Y\%m\%d).sql
```

### 重启服务

```bash
pm2 restart cardshopdir
systemctl reload nginx
```

---

## 端口分配

| 应用 | 端口 | Nginx 域名 |
|---|---|---|
| firsto.co | 3001 | firsto.co |
| **cardshopdir** | **3002** | **cardshopdir.com** |
| aiaffiliatelist.com | 5176 | aiaffiliatelist.com |
| bskyinfo.com | ? | bskyinfo.com |

---

## 故障排查

### 构建失败

```bash
# 检查环境变量
bun run scripts/seed-shops.ts --dry-run

# 检查数据库连接
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "SELECT 1;"

# 检查内存
free -h
# 如果内存不足，用 swap:
# fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

### 502 Bad Gateway

```bash
# 检查 PM2 进程是否运行
pm2 status

# 检查端口
ss -tlnp | grep 3002

# 检查日志
pm2 logs cardshopdir --lines 50
```

### 图片 404

```bash
# 检查 R2 公开访问
curl -I https://assert.cardshopdir.com/shops/test.jpg

# 检查 DNS
dig assert.cardshopdir.com

# 如果 SSL 没生效，等 Cloudflare 签发证书（可能需要几小时）
```
