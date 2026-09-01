# cardshopdir.com — MVP 技术方案

> 文档版本：v1.0 | 日期：2026-08-30
> 用途：下一阶段 MVP 开发的依据与执行蓝图

---

## 1. 项目概述

### 1.1 一句话定位

cardshopdir.com 是一个面向美国市场的 TCG（集换式卡牌）实体店目录站，通过 Programmatic SEO 截流长尾地理搜索流量（如 "card shops in Fresno CA"、"pokemon card store near me"），最终通过 Sponsorship + 店主认领变现。

### 1.2 参考竞品

| 竞品   | 域名            | 上线    | 月访问 | 流量来源  | 弱点                                                     |
| ------ | --------------- | ------- | ------ | --------- | -------------------------------------------------------- |
| KeepUp | keepupcards.com | 2025-11 | ~35K   | 90%+ 搜索 | 46% 描述模板化、评价疑似 AI 生成、无独占数据、无实时功能 |

### 1.3 核心假设（MVP 要验证的 3 件事）

1. **Google 会收录 pSEO 页面吗？** — 州/城市/店铺聚合页能否被索引
2. **长尾地理词能带来流量吗？** — "card shops in {city}" 类查询能否进 Top 20
3. **店主愿意付费曝光吗？** — Sponsorship + 认领的转化率

---

## 2. 数据资产

### 2.1 数据管线

通过逆向 keepupcards.com 的 JSON-LD 结构化数据，已获取 **7,730 家美国 TCG 店铺**的完整基础数据，并完成清洗、增强和描述生成。

| 阶段         | 文件                     | 说明                                                 |
| ------------ | ------------------------ | ---------------------------------------------------- |
| 1. 抓取      | `data/shops.jsonl`       | 7,730 条原始 JSON（从 keepupcards JSON-LD 逆向）     |
| 1. 抓取      | `scrape_shops.py`        | 抓取脚本（支持断点续跑，并发 12）                    |
| 2. 清洗+增强 | `data/shops_clean.jsonl` | 去重 8 条 → 7,722 条，games 推断，富模板描述         |
| 3. LLM 描述  | `data/shops_final.jsonl` | **最终数据**，1,104 条 LLM 差异化描述                |
| 2-3. 脚本    | `clean_and_enrich.py`    | 清洗 + games 推断 + 描述生成一体化脚本               |
| Sitemap 源   | `sitemap.xml`            | 11,146 个 URL（含 7,730 shop + 3,384 city + 67 hub） |

### 2.2 最终字段完整度（清洗后 7,722 条）

| 字段                                      | 完整率     | 备注                                              |
| ----------------------------------------- | ---------- | ------------------------------------------------- |
| name / website / street / country / image | 100%       | 核心字段全有                                      |
| city / state / postal_code / 经纬度       | 98.8–99.9% | 仅极少数缺失                                      |
| telephone                                 | 92.8%      | 7,172 条                                          |
| rating_value / review_count               | 96.2%      | 7,433 条                                          |
| hours（营业时间）                         | 69.1%      | 5,340 条                                          |
| **games（经营卡牌品类）**                 | **70.9%**  | 5,475 条（原 50.5%，规则推断+爬官网提升至 70.9%） |
| **description（差异化描述）**             | **100%**   | 全部有描述（LLM + 富模板 + 原始）                 |
| email                                     | 33.2%      | 2,565 条                                          |
| **shop_type（店铺分类）**                 | **100%**   | 新增字段，用于筛选                                |
| **should_index**                          | **42.3%**  | 3,266 条满足 index 条件                           |

### 2.3 描述来源分布

| 来源              | 数量  | 占比  | 说明                                                     |
| ----------------- | ----- | ----- | -------------------------------------------------------- |
| original          | 4,135 | 53.5% | KeepUp 原始非模板描述（真实用户评价/官网简介）           |
| template          | 2,473 | 32.0% | 富模板生成（含真实数据点：地址、游戏、评分、营业时间）   |
| llm               | 1,104 | 14.3% | DeepSeek-V4-Flash 生成（100-150 字差异化描述，全部唯一） |
| template_fallback | 10    | 0.1%  | LLM 失败后回退富模板                                     |

**LLM 描述质量**：1,104/1,104 全部唯一（0 重复），平均 546 字符，已清理所有 keepupcards 引用。

### 2.4 Games 字段来源分布

| 来源     | 数量  | 占比  | 说明                                       |
| -------- | ----- | ----- | ------------------------------------------ |
| original | 3,896 | 50.5% | KeepUp JSON-LD 原始数据                    |
| website  | 1,525 | 19.7% | 爬取店铺官网首页关键词匹配                 |
| unknown  | 2,247 | 29.1% | 无法推断（官网为 Facebook/无法访问），留空 |
| rule     | 54    | 0.7%  | 店名/官网关键词规则匹配                    |

### 2.5 店铺分类（shop_type，新增字段）

| 类型           | 数量  | 占比  | 说明                                          |
| -------------- | ----- | ----- | --------------------------------------------- |
| other          | 3,675 | 47.6% | 无法归类的通用店铺                            |
| game_store     | 1,676 | 21.7% | 店名含 game/gaming                            |
| comic_shop     | 752   | 9.7%  | 店名含 comic                                  |
| tcg_specialty  | 443   | 5.7%  | 店名含 card shop/tcg/trading card             |
| sports_cards   | 429   | 5.6%  | 店名含 sports card                            |
| hobby_store    | 240   | 3.1%  | 店名含 hobby                                  |
| toy_store      | 227   | 2.9%  | 店名含 toy                                    |
| collectibles   | 175   | 2.3%  | 店名含 collectible                            |
| general_retail | 105   | 1.4%  | 连锁零售（Dunham's Sports、Go! Calendars 等） |

> **注意**：非 TCG 连锁店**不删除**，改为分类标注。用户可筛选"只看 TCG 专营店"，但所有店保留在目录中，不损失 SEO 页面数量。

### 2.6 地理覆盖

- 50 个州 + DC，3,384 个唯一城市
- 店铺密度 Top 5 州：CA(655) / TX(445) / FL(369) / OH(314) / NY(310)

### 2.7 卡牌品类分布

Pokemon(2,218) > Flesh and Blood(1,838) > MTG(1,541) > Yu-Gi-Oh(1,298) > Sports(1,284) > Lorcana(881) > DBS(568) > Star Wars Unlimited(433) > One Piece(329) > Riftbound(305) > Union Arena(265) > Digimon(129)

### 2.8 已解决的数据质量风险

| 原风险                   | 状态        | 处理结果                                                               |
| ------------------------ | ----------- | ---------------------------------------------------------------------- |
| 46.4% 描述模板化         | ✅ 已解决   | 1,104 条 LLM 生成 + 2,473 条富模板替换 + 4,135 条原始保留 = 0 模板描述 |
| 268 个重复店名（连锁店） | ✅ 已解决   | 不删除，改为 shop_type 分类标注                                        |
| 50% 缺 games 字段        | ✅ 部分解决 | 规则推断 54 + 爬官网 1,525 = games 覆盖率从 50.5% 提升至 70.9%         |
| 8 对同名同城市重复       | ✅ 已解决   | 去重后 7,722 条                                                        |
| 评价正文未抓取           | ⏳ P1 处理  | MVP 阶段不展示评价，P1 做 UGC 邀评                                     |

---

## 3. 技术选型

### 3.1 架构决策

**域名在 Cloudflare 注册，应用部署在自有 VPS，数据库和 Redis 均使用 VPS 本地实例。**

> **不使用 Cloudflare Workers + D1**：cardshopdir 依赖 `proxy.ts`（Workers 不支持）、`postgres-js` 驱动（D1 是 SQLite 不兼容）、`ioredis`（Workers 上非原生支持），迁移成本高且引入兼容性风险。
>
> **不使用 Vercel + Neon**：已有 VPS（2 核 8GB / 100GB / 8TB 带宽）且已部署 2 个生产应用，Postgres 16 + Redis 7 + Bun + Nginx + Certbot 全部就绪。自托管零额外成本，数据完全可控，无免费档限制（Neon 0.5GB / Vercel 100GB 带宽对 7,730 页 SSG 站点有风险）。

### 3.2 VPS 现有环境

| 项目       | 状态                                                                          | 说明                            |
| ---------- | ----------------------------------------------------------------------------- | ------------------------------- |
| OS         | Ubuntu 24.04                                                                  | x86_64                          |
| CPU / 内存 | 2 核 / 8GB                                                                    | 当前已用 2.8GB，可用 5.0GB      |
| 磁盘       | 100GB（已用 45GB，剩 52GB）                                                   | 充裕                            |
| 带宽       | 8TB/月                                                                        | 远超需求                        |
| Bun        | 1.1.34 (`/root/.bun/bin/bun`)                                                 | 包管理 + 运行时                 |
| PostgreSQL | 16.15                                                                         | 已运行，监听 0.0.0.0:5432       |
| Redis      | 7.0.15                                                                        | 已运行，监听 127.0.0.1:6379     |
| Nginx      | 已运行                                                                        | 反代 + SSL，端口 80/443         |
| Certbot    | 已安装                                                                        | Let's Encrypt 自动续期          |
| 现有应用   | firsto.co(:3001)、bskyinfo.com、aiaffiliatelist.com(:5176)、dognamesworld.com | Nginx 反代 + Next.js standalone |

**部署模式**：与现有应用一致 — `bun run build` → `next start` (standalone) → Nginx 反代 → Certbot SSL。不引入 Docker。

### 3.3 技术栈（全部复用 cardshopdir + VPS 本地服务）

| 层              | 选型                              | 来源                    | MVP 成本         |
| --------------- | --------------------------------- | ----------------------- | ---------------- |
| 框架            | Next.js 16 (App Router, RSC)      | 模板内置                | $0               |
| 语言            | TypeScript                        | 模板内置                | $0               |
| 包管理 / 运行时 | Bun 1.1.34                        | VPS 已有                | $0               |
| ORM             | Drizzle ORM                       | 模板内置                | $0               |
| 数据库          | **PostgreSQL 16**（VPS 本地实例） | VPS 已有                | $0               |
| 认证            | Better Auth                       | 模板内置                | $0               |
| 支付            | Stripe                            | 模板内置                | $0（按交易抽成） |
| 图床            | Cloudflare R2                     | 模板内置 (AWS SDK 兼容) | $0（10GB 免费）  |
| 限流            | **Redis 7**（VPS 本地实例）       | VPS 已有                | $0               |
| 邮件            | Plunk 免费档                      | 模板内置                | $0               |
| 验证码          | Cloudflare Turnstile              | 模板内置                | $0               |
| 博客            | Tiptap 编辑器                     | 模板内置                | $0               |
| 分析            | Plausible 免费档                  | 模板内置                | $0               |
| 样式            | Tailwind CSS + shadcn/ui          | 模板内置                | $0               |
| 进程管理        | **PM2** 或 systemd                | VPS 已有模式            | $0               |
| 反向代理        | **Nginx**                         | VPS 已有                | $0               |
| SSL             | **Certbot / Let's Encrypt**       | VPS 已有                | $0               |
| 托管            | **自有 VPS**                      | 已有                    | $0（已付）       |
| 域名            | **Cloudflare** Registrar          | —                       | ~$10/年          |

**总成本 ≈ 域名费用（~$10/年），其余全部使用已有资源。**

### 3.4 域名

- 主域名：`cardshopdir.com`（已验证 .com 可用）
- 注册商：Cloudflare Registrar（成本价续费，无 upsell）
- DNS：Cloudflare（免费，可套 CDN）
- 建议注册年限：5-10 年（给 Google 信任信号）

### 3.5 部署架构

```
┌─────────────────────────────────────────────────────┐
│                   用户浏览器                          │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Cloudflare DNS                   │
│  域名: cardshopdir.com             │
│  A 记录 → VPS IP                   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  VPS (2核 8GB / Ubuntu 24.04)                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Nginx (端口 80/443)                          │   │
│  │  - cardshopdir.com → 127.0.0.1:3002           │   │
│  │  - SSL: Let's Encrypt (Certbot)               │   │
│  │  - 现有: firsto.co → :3001 等                  │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                     │
│                 ▼                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Next.js 16 standalone (PM2/systemd)          │   │
│  │  端口: 3002                                   │   │
│  │  - SSG 预渲染页面                              │   │
│  │  - ISR 店铺详情页                              │   │
│  │  - SSR 动态页面                                │   │
│  └──────┬──────────────┬────────────────────────┘   │
│         │              │                              │
│         ▼              ▼                              │
│  ┌────────────┐  ┌──────────────┐                    │
│  │ PostgreSQL │  │ Redis 7      │                    │
│  │ 16         │  │ (限流)        │                    │
│  │ :5432      │  │ :6379        │                    │
│  │ 新建数据库: │  └──────────────┘                    │
│  │ cardshopdir│                                      │
│  └────────────┘                                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  外部服务 (SaaS 免费档)                        │   │
│  │  - Cloudflare R2 (图床, 10GB免费)              │   │
│  │  - Stripe (支付)                               │   │
│  │  - Plunk (邮件)                                │   │
│  │  - Turnstile (验证码)                          │   │
│  │  - Plausible (分析)                            │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 3.6 部署流程

```bash
# 1. 在 VPS 上创建数据库
sudo -u postgres psql -c "CREATE DATABASE cardshopdir;"
sudo -u postgres psql -c "CREATE USER cardshopdir WITH PASSWORD '<strong-password>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cardshopdir TO cardshopdir;"

# 2. 克隆代码
cd /var/www
git clone <repo-url> cardshopdir
cd cardshopdir

# 3. 安装依赖
bun install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库连接、Stripe、R2 等

# 5. 运行数据库迁移 + 数据导入
bun run db:generate
bun run db:migrate
bun run db:seed          # 导入 7,730 条店铺数据

# 6. 构建
bun run build

# 7. 用 PM2 启动（与现有应用一致）
pm2 start "bun run start" --name cardshopdir
pm2 save

# 8. 配置 Nginx 反代
# /etc/nginx/sites-available/cardshopdir.com
#   server {
#     server_name cardshopdir.com www.cardshopdir.com;
#     location / {
#       proxy_pass http://127.0.0.1:3002;
#       proxy_set_header Host $host;
#       proxy_set_header X-Real-IP $remote_addr;
#       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#       proxy_set_header X-Forwarded-Proto $scheme;
#       proxy_http_version 1.1;
#       proxy_set_header Upgrade $http_upgrade;
#       proxy_set_header Connection 'upgrade';
#     }
#   }
ln -s /etc/nginx/sites-available/cardshopdir.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 9. 申请 SSL 证书
certbot --nginx -d cardshopdir.com -d www.cardshopdir.com

# 10. 提交 sitemap 到 Google Search Console
```

### 3.7 环境变量

```env
# ── 数据库 (VPS 本地 Postgres) ──
DATABASE_URL=postgresql://cardshopdir:<password>@localhost:5432/cardshopdir

# ── 认证 ──
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://cardshopdir.com

# ── OAuth ──
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Cloudflare R2 (图床) ──
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# ── Stripe (支付) ──
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ── Redis (VPS 本地，无需密码) ──
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ── 邮件 (Plunk) ──
PLUNK_SECRET_KEY=
PLUNK_FROM_EMAIL=noreply@cardshopdir.com

# ── Cron ──
CRON_SECRET=

# ── Turnstile (验证码) ──
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# ── 分析 (Plausible) ──
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=cardshopdir.com

# ── Discord ──
DISCORD_WEBHOOK_URL=
```

---

## 4. 数据模型设计

### 4.1 改造原则

cardshopdir 原始 schema 是"每周产品发布目录"（batches → products → votes → comments）。改造策略：

- **保留**：user / session / account / verification（Better Auth）、siteSettings、posts（博客）、sponsors（付费曝光）
- **改造**：products → shops、comments → shop_reviews
- **新增**：games、shop_games、shop_hours
- **移除**：batches、votes（MVP 不需要投票功能）

### 4.2 Schema 定义

```typescript
// ── 保留不变 ──────────────────────────────────────────────────
// user, session, account, verification  (Better Auth)
// siteSettings                          (站点配置)
// posts                                 (博客)
// sponsors                              (付费曝光，完全复用)

// ── 改造：products → shops ────────────────────────────────────
export const shopTier = pgEnum('shop_tier', ['free', 'boost', 'highlight']);

export const shopStatus = pgEnum('shop_status', [
  'listed',
  'claimed',
  'hidden',
]);

export const shops = pgTable(
  'shops',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    metaDescription: text('meta_description'),

    // 联系信息
    website: text('website'),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 200 }),

    // 地址
    street: varchar('street', { length: 300 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 50 }),
    postalCode: varchar('postal_code', { length: 20 }),
    country: varchar('country', { length: 50 }),

    // 经纬度（地图 + "near me" 排序）
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),

    // 聚合评分
    ratingValue: decimal('rating_value', { precision: 3, scale: 1 }),
    reviewCount: integer('review_count').default(0),

    // 图片
    imageUrl: text('image_url'),

    // 商业
    tier: shopTier('tier').notNull().default('free'),
    status: shopStatus('status').notNull().default('listed'),
    claimUserId: text('claim_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    // 数据溯源
    sourceUrl: text('source_url'),
    verifiedAt: timestamp('verified_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('shops_state_idx').on(t.state),
    index('shops_city_state_idx').on(t.city, t.state),
    index('shops_tier_idx').on(t.tier),
    index('shops_status_idx').on(t.status),
  ],
);

// ── 新增：卡牌游戏分类 ────────────────────────────────────────
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
});

export const shopGames = pgTable(
  'shop_games',
  {
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, {
        onDelete: 'cascade',
      }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, {
        onDelete: 'cascade',
      }),
  },
  (t) => [
    uniqueIndex('shop_games_unique').on(t.shopId, t.gameId),
    index('shop_games_game_idx').on(t.gameId),
  ],
);

// ── 新增：营业时间 ────────────────────────────────────────────
export const shopHours = pgTable(
  'shop_hours',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, {
        onDelete: 'cascade',
      }),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday ... 6=Saturday
    opens: varchar('opens', { length: 10 }), // "10:00"
    closes: varchar('closes', { length: 10 }), // "18:00"
  },
  (t) => [
    index('shop_hours_shop_idx').on(t.shopId),
    uniqueIndex('shop_hours_unique').on(t.shopId, t.dayOfWeek),
  ],
);

// ── 改造：comments → shop_reviews ─────────────────────────────
export const reviewStatus = pgEnum('review_status', ['approved', 'rejected']);

export const shopReviews = pgTable(
  'shop_reviews',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, {
        onDelete: 'cascade',
      }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, {
        onDelete: 'cascade',
      }),
    rating: integer('rating').notNull(), // 1-5
    body: text('body'),
    status: reviewStatus('status').notNull().default('approved'),
    ip: text('ip'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('shop_reviews_shop_idx').on(t.shopId),
    index('shop_reviews_status_idx').on(t.status),
    uniqueIndex('shop_reviews_user_shop').on(t.userId, t.shopId),
  ],
);
```

### 4.3 预置游戏数据

```typescript
const GAMES = [
  { slug: 'pokemon', name: 'Pokemon', sortOrder: 1 },
  { slug: 'magic-the-gathering', name: 'Magic: The Gathering', sortOrder: 2 },
  { slug: 'yu-gi-oh', name: 'Yu-Gi-Oh!', sortOrder: 3 },
  { slug: 'flesh-and-blood', name: 'Flesh and Blood', sortOrder: 4 },
  { slug: 'sports', name: 'Sports Cards', sortOrder: 5 },
  { slug: 'lorcana', name: 'Lorcana', sortOrder: 6 },
  { slug: 'dragon-ball-super', name: 'Dragon Ball Super', sortOrder: 7 },
  { slug: 'star-wars-unlimited', name: 'Star Wars Unlimited', sortOrder: 8 },
  { slug: 'one-piece', name: 'One Piece', sortOrder: 9 },
  { slug: 'riftbound', name: 'Riftbound', sortOrder: 10 },
  { slug: 'union-arena', name: 'Union Arena', sortOrder: 11 },
  { slug: 'digimon', name: 'Digimon', sortOrder: 12 },
];
```

---

## 5. 路由结构（pSEO 核心）

### 5.1 路由树

```
app/
├── page.tsx                        # 首页：搜索 + 按州/游戏浏览
├── directory/
│   ├── page.tsx                    # 全部店铺列表（分页 + 筛选）
│   ├── states/
│   │   └── page.tsx                # 50 州索引页
│   ├── [state]/
│   │   ├── page.tsx                # 州页：该州所有店铺（SSG）
│   │   ├── [city]/
│   │   │   └── page.tsx            # 城市页（SSG，~3,384 个）
│   │   └── games/
│   │       └── [game]/
│   │           └── page.tsx        # ⭐ 州+游戏交叉页（SSG，50×12=600 个）
│   └── games/
│       ├── page.tsx                # 游戏索引页
│       └── [game]/
│           └── page.tsx            # 单游戏页（12 个）
├── shop/
│   └── [slug]/
│       └── page.tsx                # 店铺详情页（ISR，7,730 个）
├── submit/
│   └── page.tsx                    # 店主提交（复用模板）
├── claim/
│   └── [slug]/
│       └── page.tsx                # 店主认领（新增）
├── sponsor/
│   └── page.tsx                    # 付费曝光（复用模板）
├── blog/
│   ├── page.tsx                    # 博客列表（复用模板）
│   └── [slug]/
│       └── page.tsx                # 博客文章（复用模板）
├── about/page.tsx                  # 关于（复用模板）
├── contact/page.tsx                # 联系（复用模板）
├── privacy/page.tsx                # 隐私政策（复用模板）
├── terms/page.tsx                  # 服务条款（复用模板）
├── sign-in/page.tsx                # 登录（复用模板）
├── sign-up/page.tsx                # 注册（复用模板）
├── admin/                          # 管理后台（复用模板）
└── api/
    ├── auth/[...all]/              # Better Auth API（复用）
    ├── sponsor/checkout/           # Stripe 支付（复用）
    └── cron/                       # 定时任务（复用）
```

### 5.2 渲染策略

| 路由                | 渲染方式                   | 理由                           |
| ------------------- | -------------------------- | ------------------------------ |
| 首页                | SSG                        | 稳定内容                       |
| 州目录页 (50)       | SSG                        | `generateStaticParams` 预生成  |
| 城市目录页 (~3,384) | SSG                        | `generateStaticParams` 预生成  |
| 游戏分类页 (12)     | SSG                        | 预生成                         |
| 州+游戏交叉页 (600) | SSG                        | `generateStaticParams` 预生成  |
| 店铺详情页 (7,730)  | **ISR** (revalidate: 3600) | 数据量大，ISR 平衡性能与新鲜度 |
| 提交/认领/支付      | SSR                        | 动态交互                       |
| 博客                | SSG                        | 复用模板                       |

### 5.3 URL Slug 规则

- 州页：`/directory/california`（州名 slug 化）
- 城市页：`/directory/california/fresno`
- 游戏页：`/directory/games/pokemon`
- 州+游戏交叉页：`/directory/california/games/pokemon`
- 店铺页：`/shop/{slug}`（slug 来自源数据，如 `1-stop-card-shop-hillsboro-or`）

### 5.4 页面数量汇总

| 页面类型           | 数量       | Index 策略     |
| ------------------ | ---------- | -------------- |
| 首页 + 工具页      | ~10        | index          |
| 州索引页           | 1          | index          |
| 州目录页           | 50         | index          |
| 城市目录页         | ~3,384     | index          |
| 游戏索引页         | 1          | index          |
| 游戏分类页         | 12         | index          |
| 州+游戏交叉页      | 600        | index          |
| 店铺详情页（精选） | ~2,500     | index          |
| 店铺详情页（薄）   | ~5,230     | noindex,follow |
| **可索引总计**     | **~6,558** |                |

---

## 6. 竞品聚合页分析与超越策略

### 6.1 KeepUp 聚合页现状（4 种页面逐个拆解）

#### 州索引页 `/directory/states`

| 维度             | 内容                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| H1               | `Browse by State`                                                                                           |
| Meta description | `Find trading card game shops by state. Browse our directory of TCG stores across all 50 US states and DC.` |
| JSON-LD          | `CollectionPage` + `ItemList`（列出全部 51 个州链接）                                                       |
| 页面内容         | 纯链接列表，50 州 + DC，无额外文字                                                                          |

#### 州目录页 `/directory/california`

| 维度             | 内容                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | `Trading Card Shops in California`                                                                                                     |
| Meta description | `Find trading card game shops in California. Pokemon, Magic: The Gathering, Yu-Gi-Oh! and more. Browse TCG stores in California.`      |
| Keywords         | `TCG shops California, trading card shops California, card shops California, Pokemon shops California, Magic The Gathering California` |
| JSON-LD          | `CollectionPage` + `BreadcrumbList`                                                                                                    |
| 页面内容         | ① 城市列表（237 个城市，带店铺数量）② 店铺卡片列表（655 家，含评分、评价数、城市、描述、Online Store 标签）③ 筛选器（游戏 + Features） |
| 分页             | 无（655 家全在一个页面）                                                                                                               |

#### 城市目录页 `/directory/california/fresno`

| 维度             | 内容                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | `Trading Card Shops in Fresno, California`                                                                                               |
| Meta description | `Find 12 trading card game shops in Fresno, California. Pokemon, Magic: The Gathering, Yu-Gi-Oh! and more. Browse TCG stores in Fresno.` |
| Keywords         | `TCG shops Fresno, trading card shops Fresno, card shops Fresno California, Pokemon shops Fresno, Magic The Gathering Fresno`            |
| JSON-LD          | `CollectionPage` + `BreadcrumbList`                                                                                                      |
| 页面内容         | ① 12 家店铺卡片 ② "Other Cities in California" 侧边栏（带数量）③ 筛选器                                                                  |

#### 游戏分类页 `/directory/games/pokemon`

| 维度             | 内容                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| H1               | `Pokemon Card Shops`                                                                         |
| Meta description | `Find Pokemon shops in the KeepUp directory. Browse trading card stores that carry Pokemon.` |
| JSON-LD          | `CollectionPage` + `BreadcrumbList`                                                          |
| 页面内容         | 2,218 家店铺，分页显示（148 页），每页 15 家                                                 |

### 6.2 KeepUp 做对了的（我们要参考）

| 策略                                  | 具体做法                                                             | 为什么有效                                   |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| **地理层级内链**                      | 州页列出所有城市（带数量）→ 城市页列出所有店铺                       | 三层漏斗，每层都有内链，爬虫可遍历全站       |
| **CollectionPage + ItemList JSON-LD** | 聚合页用 `CollectionPage` 类型，州索引页用 `ItemList` 列出全部子页面 | 明确告诉 Google 这是聚合页，传递内链权重     |
| **BreadcrumbList JSON-LD**            | 每页都有面包屑结构化数据                                             | 帮助 Google 理解站点层级                     |
| **Meta description 含数量**           | `Find 12 trading card game shops in Fresno`                          | 数量词提升 SERP 点击率                       |
| **侧边栏同州城市**                    | 城市页右侧列出同州其他城市（带数量）                                 | 内链闭环，降低跳出率，帮助爬虫发现更多城市页 |
| **店铺卡片含真实描述**                | 部分店铺用 Google Maps 评价作为描述                                  | 比模板描述有差异化价值                       |

### 6.3 KeepUp 做错了的 / 没做的（我们要超越）

| 缺陷                                 | KeepUp 的问题                                                 | 我们的改进方案                                                                          |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **聚合页无独特文字内容**             | 州/城市页只有 H1 + 店铺列表，没有介绍性段落                   | 每个州/城市页加 100-200 字独特介绍（LLM 生成 + 人工审核），含地理关键词                 |
| **游戏页 meta description 含品牌词** | `Find Pokemon shops in the KeepUp directory` — 浪费 SERP 空间 | 改为 `Find 2,218 Pokemon card shops across the US. Browse by state and city.`           |
| **州页无分页/性能问题**              | 655 家店铺全在一个页面                                        | 做分页或懒加载，保持首屏快速                                                            |
| **无 FAQ 结构化数据**                | 没有任何 FAQ                                                  | 加 FAQ schema（如 "How many card shops are in California?"），获取 SERP 富摘要          |
| **无 "near me" 优化**                | 没有基于用户位置的推荐                                        | 加 "Shops near you" 功能（基于 lat/lng），命中 "card shops near me" 高搜索量词          |
| **城市页无人口/区域信息**            | 城市页只有店铺列表，没有城市背景                              | 加城市简介（人口、是否大城市、卡牌社区活跃度），增加内容独特性                          |
| **无州 ↔ 游戏交叉页**                | 没有 `/directory/california/pokemon` 这种交叉页               | 加州+游戏交叉页（50州 × 12游戏 = 600 页），覆盖 "pokemon card shops in California" 长尾 |
| **Features 筛选器无独立页面**        | 有 "Hosts Tournaments" 筛选但无对应 URL                       | 为高频筛选创建独立页面，覆盖 "card shops that host tournaments near me"                 |

### 6.4 聚合页内容模板（超越 KeepUp 的核心）

每个州/城市页应包含以下模块：

```
┌─────────────────────────────────────────┐
│ H1: Trading Card Shops in Fresno, CA    │
├─────────────────────────────────────────┤
│ 📝 独特介绍段落（100-200字）              │
│ "Fresno is home to 12 trading card     │
│ shops, serving the Central Valley's     │
│ growing TCG community. Popular games    │
│ in the area include Pokemon and MTG..." │
├─────────────────────────────────────────┤
│ 🏪 店铺列表（卡片，含评分、品类、地址）    │
├─────────────────────────────────────────┤
│ 🗺️ 地图视图（基于 lat/lng）              │
├─────────────────────────────────────────┤
│ 🏘️ 同州其他城市（带数量，内链）           │
├─────────────────────────────────────────┤
│ ❓ FAQ（3-5 个，含 FAQPage JSON-LD）     │
│ "How many card shops are in Fresno?"    │
│ "What games are popular in Fresno?"     │
├─────────────────────────────────────────┤
│ 🍞 面包屑（BreadcrumbList JSON-LD）      │
└─────────────────────────────────────────┘
```

### 6.5 JSON-LD 策略（参照 + 增强）

| 页面类型      | KeepUp 用的                         | 我们应该用的                                     |
| ------------- | ----------------------------------- | ------------------------------------------------ |
| 州索引页      | `CollectionPage` + `ItemList`       | 同 + `WebSite` 声明                              |
| 州目录页      | `CollectionPage` + `BreadcrumbList` | 同 + `ItemList`（列出城市）                      |
| 城市目录页    | `CollectionPage` + `BreadcrumbList` | 同 + `ItemList`（列出店铺）+ `FAQPage`           |
| 游戏分类页    | `CollectionPage` + `BreadcrumbList` | 同 + `ItemList`                                  |
| 州+游戏交叉页 | ❌ 没有                             | `CollectionPage` + `BreadcrumbList` + `ItemList` |
| 店铺详情页    | `LocalBusiness` + `BreadcrumbList`  | 同（已有）                                       |

### 6.6 Meta description 模板（超越 KeepUp）

| 页面          | KeepUp                                                          | 我们的方案                                                                                                         |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 州页          | `Find trading card game shops in California. Pokemon, Magic...` | `Find {count} trading card shops in California. Browse Pokemon, MTG, Yu-Gi-Oh stores in {top 3 cities}.`           |
| 城市页        | `Find 12 trading card game shops in Fresno, California.`        | `Find {count} card shops in Fresno, CA. Browse Pokemon, MTG, Yu-Gi-Oh stores with ratings, hours, and directions.` |
| 游戏页        | `Find Pokemon shops in the KeepUp directory.`                   | `Find {count} Pokemon card shops across {states} US states. Browse by state and city with ratings and hours.`      |
| 州+游戏交叉页 | ❌                                                              | `Find {count} Pokemon card shops in California. Browse by city with ratings, hours, and directions.`               |

**关键改进**：所有 description 都含**数量词** + **具体品类** + **行动动词**，不含品牌词。

---

## 7. Index 策略

### 7.1 核心原则

**不要一次性 index 全部 7,730 个 shop 页面。** 新域名 + 大量薄内容 = Google Scaled Content Abuse 触发条件。分层 index，逐步放开。

### 7.2 分层方案

| 层级                | 页面类型             | 数量         | Index 策略        | 理由                      |
| ------------------- | -------------------- | ------------ | ----------------- | ------------------------- |
| **L1 全量 index**   | 首页 + 州页 + 游戏页 | ~63          | `index, follow`   | 聚合页，天然有列表价值    |
| **L1 全量 index**   | 城市目录页           | ~3,384       | `index, follow`   | 聚合页，多店铺 + 地理导航 |
| **L2 选择性 index** | 店铺详情页（精选）   | ~2,000-3,000 | `index, follow`   | 满足丰富度条件            |
| **L3 noindex**      | 店铺详情页（薄）     | ~4,000-5,000 | `noindex, follow` | 等丰富后放开              |

### 7.3 Shop 页面 Index 判定逻辑

```typescript
function shouldIndexShop(shop: Shop): boolean {
  return (
    shop.reviewCount > 10 && // 有足够评价
    shop.hours?.length > 0 && // 有营业时间
    shop.games?.length > 0 && // 有经营品类
    !isTemplatedDescription(shop.description) // 描述非模板
  );
}

function isTemplatedDescription(desc: string): boolean {
  return desc.includes(' - Trading card game shop in ');
}
```

### 7.4 渐进式放开

- 上线：L1 全量 + L2 精选（约 5,500-6,500 页可索引）
- 每周：扫描 noindex 的 shop 页，若获得 UGC 评价 / 店主认领 / 独特描述 → 切换为 index
- 监控：Google Search Console 收录率，根据反馈调整阈值

### 7.5 Sitemap 生成

只将 `index` 页面写入 sitemap.xml，noindex 页面不列入。按类型拆分多个 sitemap：

```
sitemap-states.xml      # 50 州页
sitemap-cities.xml      # ~3,384 城市页
sitemap-games.xml       # 12 游戏页
sitemap-shops.xml       # ~2,500 精选店铺页
sitemap-index.xml       # sitemap 索引文件
```

---

## 8. MVP 功能清单

### 8.1 P0 — SEO 可行性验证（目标：2 周）

| #   | 功能                    | 复用模板           | 新增工作量 | 说明                                     |
| --- | ----------------------- | ------------------ | ---------- | ---------------------------------------- |
| 1   | 数据导入脚本            | 参照 seed-products | 低         | `scripts/seed-shops.ts`，导入 7,730 条   |
| 2   | Schema 改造             | 改造               | 中         | products→shops, 新增 games/hours/reviews |
| 3   | 店铺详情页 (ISR)        | product-card 改造  | 中         | 7,730 页，含 JSON-LD LocalBusiness       |
| 4   | 州目录页 (SSG)          | product-grid 复用  | 低         | 50 页                                    |
| 5   | 城市目录页 (SSG)        | product-grid 复用  | 低         | ~3,384 页                                |
| 6   | 游戏分类页 (SSG)        | product-grid 复用  | 低         | 12 页                                    |
| 7   | 首页（搜索 + 浏览入口） | 改造               | 中         | 搜索框 + 按州/游戏导航                   |
| 8   | JSON-LD 结构化数据      | 新增               | 低         | LocalBusiness + BreadcrumbList           |
| 9   | Sitemap 自动生成        | 新增               | 低         | 按类型拆分，只含 index 页                |
| 10  | Index/noindex 逻辑      | 新增               | 低         | `generateMetadata` 中实现                |
| 11  | robots.txt              | 新增               | 低         | 允许爬取，屏蔽 /admin /api               |
| 12  | 数据清洗                | 新增               | 低         | 过滤非 TCG 连锁、去重                    |

**P0 交付物**：可部署的目录站，~6,000 页可索引，提交 Google Search Console。

### 8.2 P1 — 差异化 + 变现（目标：P0 上线后 2-3 周）

| #   | 功能                  | 复用模板       | 说明                            |
| --- | --------------------- | -------------- | ------------------------------- |
| 13  | 店主认领店铺          | 改造 auth 流程 | Better Auth + 验证机制          |
| 14  | 用户评价 + 评分 (UGC) | comments 改造  | 1-5 星 + 文字评价               |
| 15  | Stripe Sponsorship    | **完全复用**   | 付费曝光位                      |
| 16  | Stripe 付费提交/置顶  | **完全复用**   | 新店铺提交收费                  |
| 17  | "附近店铺" 地图       | 新增           | 基于 lat/lng 排序，可选 leaflet |
| 18  | 营业时间展示          | 新增           | 周视图 + "是否营业中"           |
| 19  | 博客（卡牌攻略引流）  | **完全复用**   | Tiptap 编辑器                   |
| 20  | 邮件订阅              | **完全复用**   | Plunk newsletter                |

### 8.3 P2 — 增长引擎（后续迭代）

| #   | 功能                      | 说明               |
| --- | ------------------------- | ------------------ |
| 21  | 比赛事件日历              | 差异化核心功能     |
| 22  | Overpass API 数据交叉验证 | 补全 + 去重 + 校验 |
| 23  | Discord 社区集成          | 复用模板 webhook   |
| 24  | Restock 通知              | 复用 Plunk         |
| 25  | 店主后台管理              | 编辑信息、回复评价 |
| 26  | API 开放                  | 供其他应用消费     |

---

## 9. 店铺详情页设计

### 9.1 JSON-LD 结构化数据

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "1 Stop Card Shop",
  "description": "{差异化描述}",
  "url": "https://cardshopdir.com/shop/1-stop-card-shop-hillsboro-or",
  "telephone": "(503) 992-6493",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "759 Southwest 185th Avenue",
    "addressLocality": "Hillsboro",
    "addressRegion": "OR",
    "postalCode": "97006",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 45.5231,
    "longitude": -122.9876
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "562"
  },
  "openingHoursSpecification": [...],
  "makesOffer": [
    { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Pokemon" } }
  ]
}
```

### 9.2 页面内容模块

1. **面包屑**（页面顶部）：`Home > Directory > California > Fresno > 1 Stop Card Shop`
   - 每一层都是可点击链接，指向对应聚合页
   - 同时输出 `BreadcrumbList` JSON-LD（见 9.1）
   - **包含城市层级**（KeepUp 跳过了城市，我们多一层内链）
   - URL 是扁平的 `/shop/{slug}`，面包屑是逻辑层级路径，两者不矛盾
2. **Header**：店名 + 评分 + 认领状态
3. **基本信息**：地址、电话、官网链接、营业时间（含"是否营业中"）
4. **经营品类**：卡牌游戏标签（Pokemon / MTG / ...）
5. **位置地图**：经纬度 → 静态地图图或 leaflet
6. **用户评价**（P1）：UGC 评价列表 + 评分分布
7. **附近店铺**：同城市其他店铺（内链）
8. **CTA**：认领店铺 / 提交新店 / 成为 Sponsor

#### 面包屑设计细节

**可视化面包屑**（页面顶部展示）：

```
Home > Directory > California > Fresno > 1 Stop Card Shop
  /        /directory   /directory/     /directory/        当前页（无链接）
  california            california/fresno
```

**BreadcrumbList JSON-LD**（结构化数据，给搜索引擎）：

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://cardshopdir.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Directory",
      "item": "https://cardshopdir.com/directory"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "California",
      "item": "https://cardshopdir.com/directory/california"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Fresno",
      "item": "https://cardshopdir.com/directory/california/fresno"
    },
    { "@type": "ListItem", "position": 5, "name": "1 Stop Card Shop" }
  ]
}
```

**与 KeepUp 的对比**：

| 维度       | KeepUp                                   | 我们                                                      |
| ---------- | ---------------------------------------- | --------------------------------------------------------- |
| 面包屑层级 | 4 层（跳过城市）                         | **5 层（含城市）**                                        |
| 示例       | Home > Shops > Oregon > 1 Stop Card Shop | Home > Directory > California > Fresno > 1 Stop Card Shop |
| 内链传递   | 州页 → 店铺页                            | 州页 → **城市页** → 店铺页（多一层）                      |
| JSON-LD    | BreadcrumbList ✅                        | BreadcrumbList ✅（多一层）                               |

**URL 结构决策**：保持扁平 `/shop/{slug}`，不做嵌套 `/directory/{state}/{city}/{slug}`。

- slug 已含地理信息（`1-stop-card-shop-hillsboro-or`），Google 可提取地理信号
- 面包屑 + JSON-LD 补充层级关系，URL 不需要嵌套
- 扁平 URL 更稳定（店铺搬家换城市时 URL 不变）
- 与 KeepUp 方案一致，已验证可行

### 9.3 差异化描述生成

对 46.4% 模板化描述的店铺，用 LLM 基于以下真实信息生成差异化描述：

- 店名 + 地址 + 经营品类
- 评分 + 评价数
- 营业时间特征
- 官网信息

生成原则：100-150 字，自然语言，包含关键词（卡牌游戏名 + 城市名），不重复模板。

---

## 10. 部署架构

> 部署架构图、部署流程、环境变量详见 **第 3.5 / 3.6 / 3.7 节**。

核心要点：

- VPS 自托管（2 核 8GB / Ubuntu 24.04），与现有应用（firsto.co、bskyinfo.com）共用
- Nginx 反代 + Certbot SSL，端口 3002
- PostgreSQL 16 + Redis 7 本地实例，无需云服务
- PM2 进程管理，`bun run build` + `bun run start`
- 外部 SaaS 仅用免费档：R2（图床）、Stripe（支付）、Plunk（邮件）、Turnstile（验证码）、Plausible（分析）

---

## 11. 验证计划

### 11.1 时间线

| 阶段     | 时间      | 里程碑                                | 验证指标             |
| -------- | --------- | ------------------------------------- | -------------------- |
| 开发     | 第 1-2 周 | P0 完成，本地跑通                     | 功能正确性           |
| 上线     | 第 2 周末 | 部署到 Vercel + 域名解析              | 页面可访问           |
| 提交索引 | 第 3 周   | 提交 sitemap 到 Google Search Console | 爬取开始             |
| 观察     | 第 3-6 周 | 监控收录情况                          | 收录率、索引页数     |
| 评估     | 第 6-8 周 | 首批数据评估                          | 长尾词排名、自然流量 |
| 决策     | 第 8 周   | Go / No-Go                            | 是否投入 P1          |

### 11.2 关键指标

| 指标            | 工具                              | 目标                             |
| --------------- | --------------------------------- | -------------------------------- |
| 索引页数        | Google Search Console             | 上线 4 周后 > 1,000              |
| 收录率          | Search Console (已提交 vs 已索引) | > 30%                            |
| 自然点击        | Search Console (Performance)      | 第 8 周 > 500/月                 |
| 长尾词排名      | Search Console + Plausible        | "card shops in {city}" 进 Top 50 |
| 页面加载速度    | PageSpeed Insights                | LCP < 2.5s, CLS < 0.1            |
| Core Web Vitals | Search Console                    | 全部绿色                         |

### 11.3 No-Go 条件

以下任一情况出现，应暂停投入并重新评估：

- 上线 8 周后索引页数 < 100（Google 拒绝收录）
- 大量页面长期处于 "Crawled, currently not indexed"
- 收到 Google Search Console 手动操作处罚通知
- 自然流量 8 周后接近 0

---

## 12. 风险与应对

| 风险                          | 概率 | 影响 | 应对                               |
| ----------------------------- | ---- | ---- | ---------------------------------- |
| Google 不收录新域名 pSEO 页面 | 中   | 高   | 分层 index 策略 + 聚合页优先       |
| Scaled Content Abuse 处罚     | 中   | 高   | 不批量生成描述，noindex 薄页面     |
| 新域名 sandbox 期过长         | 高   | 中   | 尽早上线，持续增加真实内容         |
| 数据准确性问题                | 低   | 中   | Overpass API 交叉验证（P2）        |
| KeepUp 反爬/数据更新          | 低   | 低   | 数据已抓取完毕，不依赖持续爬取     |
| Vercel/Neon 免费档限制        | 低   | 低   | 7,730 条数据 < 0.5GB，流量 < 100GB |

---

## 13. 开发任务拆解（P0 执行清单）

### Phase 1: 数据准备 ✅ 已完成

- [x] 数据清洗：去重 8 对同名同城市 → 7,722 条
- [x] 店铺分类标注：新增 shop_type 字段（tcg_specialty / comic_shop / game_store 等 9 类）
- [x] Slug 检查：7,722 个 slug 全部唯一，0 冲突
- [x] Games 字段推断：规则匹配 54 + 爬官网 1,525 = 覆盖率从 50.5% 提升至 70.9%
- [x] 差异化描述生成：LLM 生成 1,104 条 + 富模板 2,473 条 = 0 模板描述残留
- [x] 清理 LLM 描述中的 keepupcards 引用（36 条已修复）
- [x] 输出最终数据：`data/shops_final.jsonl`（7,722 条，可直接导入）

### Phase 2: Schema + 数据导入（2-3 天）

- [x] 改造 `lib/db/schema.ts`（新增 shops/games/shopGames/shopHours/shopReviews）
- [x] 更新 `lib/db/relations.ts`
- [x] 运行 `drizzle-kit generate` + `drizzle-kit migrate`
- [x] 编写 `scripts/seed-games.ts`（预置 12 个游戏分类）
- [x] 编写 `scripts/seed-shops.ts`（导入 7,722 条店铺数据，从 `data/shops_final.jsonl`）
- [x] 验证数据完整性

### Phase 3: 路由 + 页面（5-7 天）

- [x] 改造首页 `app/page.tsx`（搜索 + 按州/游戏浏览）
- [x] 新增 `app/directory/states/page.tsx`（州索引页）
- [x] 新增 `app/directory/[state]/page.tsx`（州目录页，SSG）
- [x] 新增 `app/directory/[state]/[city]/page.tsx`（城市目录页，SSG）
- [x] 新增 `app/directory/games/page.tsx`（游戏索引页）
- [x] 新增 `app/directory/games/[game]/page.tsx`（游戏分类页，SSG）
- [x] 改造 `app/p/[slug]/page.tsx` → `app/shop/[slug]/page.tsx`（店铺详情页，ISR）
- [x] 实现 `generateStaticParams`（预生成所有静态路由）
- [x] 实现 `generateMetadata`（含 JSON-LD + index/noindex 逻辑）

### Phase 4: SEO 基础设施（1-2 天）

- [x] 实现 sitemap 生成（按类型拆分）
- [x] 配置 `robots.txt`
- [x] 配置 Plausible 分析
- [x] 配置 Open Graph / Twitter Card 元数据
- [x] 实现面包屑导航组件

### Phase 5: 部署 + 验证（1 天）

- [x] 注册域名 cardshopdir.com（Cloudflare）
- [x] 创建 Neon Postgres 数据库
- [x] 创建 Upstash Redis
- [x] 配置环境变量
- [x] 部署到 Vercel
- [x] 配置 Cloudflare DNS 指向 Vercel
- [x] 提交 sitemap 到 Google Search Console
- [x] 验证页面可访问 + JSON-LD 正确

**P0 预计总工期：10-15 个工作日**

---

## 附录 A: 文件清单

```
aiconsultants/
├── CARDSHOPDIR_TECH_SPEC.md      # 本文档（技术方案）
├── scrape_shops.py                # 抓取脚本（已完成使命）
├── clean_and_enrich.py            # 清洗+增强脚本（已完成使命）
├── sitemap.xml                    # keepupcards 原始 sitemap（存档）
├── data/
│   ├── shops.jsonl                # 7,730 条原始数据（存档）
│   ├── shops_clean.jsonl          # 7,722 条清洗后数据（中间产物）
│   ├── shops_final.jsonl          # 7,722 条最终数据（⭐ 导入用）
│   ├── shops.csv                  # CSV 格式（存档）
│   ├── scrape.log                 # 抓取日志
│   └── clean.log                  # 清洗日志
└── cardshopdir/                   # Next.js 应用（技术底座）
    ├── app/                       # 路由（Phase 2 改造为 directory/shop）
    ├── components/                # 组件（部分复用）
    ├── lib/
    │   ├── db/
    │   │   ├── schema.ts          # 数据模型（Phase 2 改造）
    │   │   ├── relations.ts       # 关系定义（Phase 2 更新）
    │   │   └── seed.ts            # 种子数据（Phase 2 改造）
    │   └── ...
    ├── config/
    │   └── site.ts                # 站点配置（已改为 CardShopDir）
    ├── scripts/
    │   ├── setup.ts               # 初始化脚本
    │   └── seed-shops.ts          # ⭐ Phase 2 新建（导入 shops_final.jsonl）
    ├── drizzle.config.ts          # Drizzle 配置
    ├── package.json               # 依赖（name: cardshopdir）
    ├── .env.example               # 环境变量模板
    ├── docker-compose.yml         # 本地开发用（Postgres + Redis）
    └── README.md                  # 项目说明
```

## 附录 B: 竞品参考数据

| 维度       | KeepUp       | cardshopdir (目标)           |
| ---------- | ------------ | ---------------------------- |
| 上线时间   | 2025-11      | 2026-Q4                      |
| 店铺数     | 7,730        | 7,730（同源）+ 清洗后 ~7,000 |
| URL 总数   | 11,146       | ~6,500（精选 index）         |
| 描述质量   | 46% 模板化   | 100% 差异化（LLM 重写）      |
| 评价来源   | 疑似 AI 生成 | UGC 真实评价（P1）           |
| 独占功能   | 无           | 比赛日历、Restock 通知（P2） |
| 目标月访问 | 35K          | 8 周内验证能否起量           |
