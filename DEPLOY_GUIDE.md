# CardShopDir 首次部署指南

> **VPS**: 31.220.31.224 · Ubuntu 24.04 · 2核 8GB
> **端口**: 3030 · **域名**: cardshopdir.com
> **图片CDN**: assert.cardshopdir.com (Cloudflare R2)

---

## 0. 前提条件检查

在 VPS 上确认以下软件已安装：

```bash
# 检查 Bun
bun --version   # 需要 >= 1.1.0

# 检查 PM2
pm2 --version

# 检查 Nginx
nginx -v

# 检查 PostgreSQL
psql --version  # 需要 >= 14

# 如果缺少，一键安装：
# curl -fsSL https://bun.sh/install | bash
# npm install -g pm2
# apt install -y nginx postgresql
```

---

## 1. 创建数据库

```bash
sudo -u postgres psql << 'SQL'
CREATE USER cardshopdir WITH PASSWORD 'Bingwu718';
CREATE DATABASE cardshopdir_prod OWNER cardshopdir;
GRANT ALL PRIVILEGES ON DATABASE cardshopdir_prod TO cardshopdir;
SQL

# 验证
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "SELECT 1;"
```

---

## 2. 克隆代码

```bash
mkdir -p /root/websites
cd /root/websites

# 方式 A: 从 GitHub 克隆（推荐）
git clone git@github.com:TangSirOnGit/cardshopdir_workspace.git
cd cardshopdir_workspace/cardshopdir

# 方式 B: 从本地上传（如果没有 GitHub 仓库）
# 在本地 Mac 上执行：
# scp -r /Users/tangsir/work/source_code/cardshopdir-workspace root@31.220.31.224:/root/websites/
```

---

## 3. 安装依赖

```bash
cd /root/websites/cardshopdir_workspace/cardshopdir
bun install
```

---

## 4. 配置环境变量

```bash
# 复制生产环境配置
cp .env.prod .env

# 验证关键配置
grep -E "DATABASE_URL|BETTER_AUTH_URL|R2_PUBLIC_URL|NEXT_PUBLIC_UMAMI" .env
# 应该看到：
# DATABASE_URL=postgresql://cardshopdir:Bingwu718@localhost:5432/cardshopdir_prod
# BETTER_AUTH_URL=https://cardshopdir.com
# R2_PUBLIC_URL=https://assert.cardshopdir.com
# NEXT_PUBLIC_UMAMI_WEBSITE_ID=f07e2a7b-21d8-42de-9f66-037fb2806852

# IndexNow：生成一个 8-128 位字母/数字/短横线组成的 key，并加入 .env。
# 该 key 会通过 https://cardshopdir.com/<key>.txt 提供给搜索引擎验证。
# 例如：openssl rand -hex 32
# INDEXNOW_KEY=<生成的 key>

# 如果 DATABASE_URL 指向远程，改为 localhost：
# sed -i 's/31.220.31.224/localhost/g' .env
```

---

## 5. 运行数据库迁移

```bash
# 生成迁移文件（如果 schema 有变化）
bun run drizzle-kit generate

# 推送迁移到生产数据库
bun run drizzle-kit migrate

# 验证表已创建（应该有 13 个表）
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "\dt"
```

---

## 6. 导入种子数据

```bash
# 先把 data/shops_final.jsonl 传到 VPS（如果在本地）
# 在本地 Mac 执行：
# scp /Users/tangsir/work/source_code/cardshopdir-workspace/data/shops_final.jsonl \
#   root@31.220.31.224:/root/websites/cardshopdir_workspace/data/

# 导入 15 个游戏分类
bun run scripts/seed-games.ts

# 导入 7,722 家店铺
bun run scripts/seed-shops.ts

# 验证数据
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "
  SELECT 'shops' as tbl, count(*) FROM shops
  UNION ALL SELECT 'games', count(*) FROM games
  UNION ALL SELECT 'shop_games', count(*) FROM shop_games
  UNION ALL SELECT 'shop_hours', count(*) FROM shop_hours;
"
# 预期结果：
#  shops      | 7722
#  games      | 15
#  shop_games | 17207
#  shop_hours | 27390
```

---

## 7. 构建应用

```bash
cd /root/websites/cardshopdir_workspace/cardshopdir
bun run build
```

> 构建时需要连接数据库（SSG 预渲染），确保 `.env` 中 `DATABASE_URL` 指向 `localhost`。

---

## 8. 提交 IndexNow 页面

> IndexNow 是 Bing/Yandex/Seznam 等搜索引擎支持的"URL 变更主动推送"协议。
> 提交后这些搜索引擎会立即知道哪些页面需要重新抓取，无需等待自然爬取。

### 8.1 生成并配置 IndexNow key

key 是一个 8–128 位的字符串，只能包含字母、数字、短横线。在本地或 VPS 上生成：

```bash
openssl rand -hex 32
# 输出示例：a1b2c3d4e5f6...（64 位十六进制）
```

把生成的 key 加入 VPS 上的 `.env`：

```bash
cd /root/websites/cardshopdir_workspace/cardshopdir
# 编辑 .env，加入一行（替换为你的 key）
echo "INDEXNOW_KEY=你生成的key" >> .env
```

> 该 key 会通过 `https://cardshopdir.com/<INDEXNOW_KEY>.txt` 暴露给搜索引擎验证所有权。
> 路由由 `app/api/indexnow-key/[key]/route.ts` + `next.config.mjs` 的 rewrite 实现，
> 无需在 `public/` 下放任何文件。错误 key 返回 404，正确 key 返回 200 + key 内容。

### 8.2 重新构建并重启（让 key 验证路由上线）

```bash
cd /root/websites/cardshopdir_workspace/cardshopdir
bun run build
pm2 restart cardshopdir
```

### 8.3 验证 key 文件可访问

```bash
# 替换为你的真实 key
curl -i https://cardshopdir.com/<INDEXNOW_KEY>.txt
# 期望：HTTP 200，Content-Type: text/plain，body 即为 key 本身
```

### 8.4 提交 sitemap 中所有页面

```bash
cd /root/websites/cardshopdir_workspace/cardshopdir
bun run indexnow:submit
```

脚本行为：

- 读取 `https://cardshopdir.com/sitemap.xml`（即 `app/sitemap.ts` 生成的全部 URL）
- 校验所有 URL 都属于 `cardshopdir.com`，防止误提交
- 按 IndexNow 协议 POST 到 `https://api.indexnow.org/indexnow`
- 每批最多 10,000 个 URL（协议上限），自动分批
- 返回 200 或 202 即表示搜索引擎已收到通知

可选环境变量（一般无需设置）：

- `INDEXNOW_ENDPOINT`：自定义 IndexNow 端点，默认 `https://api.indexnow.org/indexnow`
- `INDEXNOW_SITEMAP_URL`：自定义 sitemap 地址，默认 `<BETTER_AUTH_URL>/sitemap.xml`

### 8.5 何时再次提交

- 新增/更新/删除店铺后（`shouldIndex` 变化的页面）
- 新增博客文章后
- 大规模数据刷新后
- **不要频繁提交未变更的 URL**（IndexNow 有反垃圾限制，429 Too Many Requests）

建议每周或每次数据更新后执行一次 `bun run indexnow:submit` 即可。

---

## 9. 用 PM2 启动（端口 3030）

```bash
# 启动
pm2 start "bun run start --port 3030" --name cardshopdir

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup   # 如果还没配置过，按提示执行返回的命令

# 验证运行
pm2 status
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:3030
# 应该返回 200
```

---

## 9. 配置 Cloudflare DNS

在 Cloudflare Dashboard 中为 `cardshopdir.com` 添加 DNS 记录：

| 类型  | 名称     | 内容                 | 代理状态         |
| ----- | -------- | -------------------- | ---------------- |
| A     | `@`      | `31.220.31.224`      | 仅 DNS（灰色云） |
| A     | `www`    | `31.220.31.224`      | 仅 DNS（灰色云） |
| CNAME | `assert` | `cardshopdir.r2.dev` | 代理（橙色云）   |

> **注意**: `assert.cardshopdir.com` 的 R2 自定义域名已在 Cloudflare R2 设置中配置。
> 主域名 `cardshopdir.com` 先用"仅 DNS"模式，等 Certbot SSL 配置好后再开启代理。

验证 DNS 生效：

```bash
dig cardshopdir.com +short
# 应该返回 31.220.31.224
```

---

## 10. 配置 Nginx 反向代理

```bash
cat > /etc/nginx/sites-available/cardshopdir.com << 'NGINX'
server {
    listen 80;
    server_name cardshopdir.com www.cardshopdir.com;

    # 主应用
    location / {
        proxy_pass http://127.0.0.1:3030;
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

        # 上传大小
        client_max_body_size 10m;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3030;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # sitemap 和 robots
    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:3030;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /robots.txt {
        proxy_pass http://127.0.0.1:3030;
        add_header Cache-Control "public, max-age=3600";
    }
}
NGINX

# 启用站点
ln -sf /etc/nginx/sites-available/cardshopdir.com /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## 11. 申请 SSL 证书

```bash
# 用 Certbot 自动配置 HTTPS
certbot --nginx -d cardshopdir.com -d www.cardshopdir.com

# Certbot 会自动：
# - 申请 Let's Encrypt 证书
# - 修改 Nginx 配置添加 SSL
# - 设置 HTTP → HTTPS 重定向
# - 配置自动续期

# 验证 HTTPS
curl -sS -o /dev/null -w "%{http_code}" https://cardshopdir.com
# 应该返回 200
```

> **Cloudflare 代理**: SSL 配置好后，可以在 Cloudflare 中把 `cardshopdir.com` 的代理状态改为"代理"（橙色云），启用 DDoS 保护和 CDN。SSL/TLS 模式设为"完全"。

---

## 12. 最终验证

```bash
# 1. 首页
curl -sS -o /dev/null -w "Home: %{http_code}\n" https://cardshopdir.com

# 2. 目录页
curl -sS -o /dev/null -w "Directory: %{http_code}\n" https://cardshopdir.com/directory

# 3. 州目录
curl -sS -o /dev/null -w "State CA: %{http_code}\n" https://cardshopdir.com/directory/ca

# 4. 店铺详情
curl -sS -o /dev/null -w "Shop: %{http_code}\n" https://cardshopdir.com/shop/1st-capital-gaming-york-pa

# 5. 图片 CDN
curl -sS -o /dev/null -w "Image: %{http_code}\n" https://assert.cardshopdir.com/shops/1st-capital-gaming-york-pa.jpg

# 6. Sitemap
curl -sS -o /dev/null -w "Sitemap: %{http_code}\n" https://cardshopdir.com/sitemap.xml

# 7. PM2 状态
pm2 status

# 8. 日志检查
pm2 logs cardshopdir --lines 20 --nostream
```

全部应该返回 200。

---

## 13. 后续更新部署（日常使用）

首次部署完成后，后续代码更新只需在本地 push 然后执行部署脚本：

### 方式 A: 本地一键部署（推荐）

在本地 Mac 上执行：

```bash
cd /Users/tangsir/work/source_code/cardshopdir-workspace

# push 代码并远程执行部署
git push && ssh -i ~/.ssh/id_hostinger root@31.220.31.224 \
  "cd /root/websites/cardshopdir_workspace && ./deploy.sh"
```

### 方式 B: 分步执行

```bash
# 1. 本地 push
git push

# 2. SSH 到 VPS 执行部署
ssh -i ~/.ssh/id_hostinger root@31.220.31.224
cd /root/websites/cardshopdir_workspace
./deploy.sh
```

### deploy.sh 常用参数

```bash
./deploy.sh                # 默认: pull → 构建 → 重启
./deploy.sh --migrate      # 同时运行数据库迁移
./deploy.sh --seed         # 同时导入种子数据
./deploy.sh --force        # 无代码变更也强制重新构建
./deploy.sh --build-only   # 跳过 pull，只构建+重启
./deploy.sh --no-pull      # 跳过 pull（已手动拉取）
```

> **注意**: 脚本会自动检测代码是否有变更，无变更时跳过构建。用 `--force` 可强制重建。

---

## 14. 提交到 Google Search Console

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加属性 `cardshopdir.com`
3. 用 DNS TXT 记录验证域名
4. 提交 sitemap: `https://cardshopdir.com/sitemap.xml`

---

## 端口分配表

| 应用                | 端口     | Nginx 域名          |
| ------------------- | -------- | ------------------- |
| firsto.co           | 3001     | firsto.co           |
| aiaffiliatelist.com | 5176     | aiaffiliatelist.com |
| **cardshopdir**     | **3030** | **cardshopdir.com** |

---

## 故障排查

### 构建失败

```bash
# 检查数据库连接
PGPASSWORD='Bingwu718' psql -U cardshopdir -d cardshopdir_prod -h localhost -c "SELECT 1;"

# 检查内存
free -h
# 如果内存不足，添加 swap:
# fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
```

### 502 Bad Gateway

```bash
pm2 status
ss -tlnp | grep 3030
pm2 logs cardshopdir --lines 50 --nostream
```

### 图片 404

```bash
curl -I https://assert.cardshopdir.com/shops/test.jpg
dig assert.cardshopdir.com
# SSL 证书可能需要等 Cloudflare 签发（几分钟到几小时）
```
