# CardShopDir 上线进度日志

> **上线日期**: 2026-08-31 上午
> **域名**: https://cardshopdir.com
> **Sitemap URL 总数**: 6,677

---

## 2026-09-01 19:00 — 上线 30 小时快照

### 一、数据汇总

#### 1. Umami 流量（30h）

| 指标           | 数值   |
| -------------- | ------ |
| Visitors（UV） | 231    |
| Visits         | 245    |
| Views（PV）    | 453    |
| Bounce rate    | 75%    |
| Visit duration | 1m 10s |
| PV / UV        | 1.96   |

#### 2. 流量来源（Referrer）

| 来源                       | Visitors | 占比 | 类型                |
| -------------------------- | -------- | ---- | ------------------- |
| news.ycombinator.com       | 43       | 64%  | 社交外链（HN 帖子） |
| github.com                 | 16       | 24%  | 外链                |
| google.com                 | 2        | 3%   | 自然搜索            |
| bing.com                   | 2        | 3%   | 自然搜索            |
| stackscope.dev             | 1        | 1%   | 外链                |
| duckduckgo.com             | 1        | 1%   | 自然搜索            |
| hacker-news.firebaseio.com | 1        | 1%   | HN 相关             |
| siteglass.io               | 1        | 1%   | 外链                |

> **流量结构分析**：88% 来自 HN + GitHub 外链爆发，属一次性事件流量。
> 自然搜索仅 5 次（google 2 + bing 2 + duckduckgo 1），SEO 基线尚未建立。

#### 3. 索引状态

| 指标             | 数值               | 来源                                 |
| ---------------- | ------------------ | ------------------------------------ |
| GSC 后台索引数   | 暂无数据           | GSC 索引报告有 2-7 天延迟            |
| site: 估算索引数 | ~100               | `site:cardshopdir.com` 返回 6 页结果 |
| GSC sitemap      | 已提交，6,677 URLs |                                      |
| Bing Webmaster   | 已提交             | 暂无数据                             |

#### 4. GSC 搜索表现（过去 24h）

| 指标   | 数值 |
| ------ | ---- |
| 总点击 | 0    |
| 总展示 | 10   |
| CTR    | 0%   |

**关键词**：
| 关键词 | 展示 | 排名 | 点击 |
|---|---|---|---|
| wax packs and throwbacks reviews | 1 | 9 | 0 |
| megafun tcg | 1 | 10 | 0 |

**有展示的页面**：
| 页面 | 展示 | 排名 |
|---|---|---|
| http://cardshopdir.com/ ⚠️ | 7 | 2.43 |
| https://cardshopdir.com/ | 2 | 2 |
| /shop/battle-bunker-dickinson-nd | 2 | 2.5 |
| /shop/rainers-pok-stop-lafayette-in | 2 | 3.5 |
| /shop/collectors-corner-nwseattle-seattle-wa | 1 | 7 |
| /shop/wax-packs-and-throwbacks-linwood-nj | 1 | 9 |
| /shop/megafun-tcg-pokmon-shop-collectibles-croydon-pa | 1 | 10 |

**地理分布**：中国 6 展示 / 美国 4 展示
**设备分布**：Desktop 7 / Mobile 3

#### 5. 技术健康检查

| 检查项           | 结果 | 备注                                         |
| ---------------- | ---- | -------------------------------------------- |
| 首页 HTTPS       | 200  | ⚠️ 加载 3.4s，偏慢                           |
| HTTP → HTTPS 301 | ✅   | 重定向正常                                   |
| sitemap.xml      | 200  | 6,677 URLs，2.4s                             |
| robots.txt       | ✅   | 允许搜索爬虫，屏蔽 AI 训练，屏蔽 /admin /api |

---

### 二、30h 关键发现

#### ✅ 积极信号

1. **索引速度超预期**：30h 内约 100 页被索引。新域名通常前 48h 仅索引首页，当前速度说明 Googlebot 抓取活跃，sitemap 被有效接收。
2. **已有搜索展示**：24h 内 10 次展示，shop 页面已开始出现在搜索结果中。新站通常 3-7 天才有展示数据。
3. **shop 页面排名靠前**：品牌词搜索中 shop 页排名 2-10 位，说明页面质量被 Google 认可。
4. **技术基础正常**：首页/sitemap 200，301 重定向生效，robots.txt 配置合理。

#### ⚠️ 需关注的问题

1. **首页加载 3.4s**：超过 Core Web Vitals LCP 目标（< 2.5s）。可能原因：
   - 首页内容较多（店铺列表/地图等）
   - 服务器在 Hostinger VPS 上，TTFB 可能偏高
   - 需 PageSpeed Insights 进一步诊断
2. **http:// 规范化未完成**：GSC 中 http:// 版本仍有 7 次展示。虽然 301 已设置，但 Google 尚未完全将信号合并到 https://。这会分散页面权重，预计 1-2 周内自动规范化。
3. **流量高度依赖外链**：88% 流量来自 HN/GitHub 一次性爆发，非可持续。HN 流量通常 2-3 天后衰减至接近 0。
4. **关键词为品牌词**：当前展示词是具体店铺名（"wax packs and throwbacks reviews"、"megafun tcg"），尚未出现目标地理长尾词（"card shops in {city}"）。这在上线 30h 属正常，地理词通常 2-4 周后开始出现。
5. **Bing 索引未见数据**：Bing 通常比 Google 慢 1-2 周，暂无数据属正常。

#### ℹ️ 符合预期的现象

- 0 搜索点击：新站 30h 内 0 点击完全正常
- 75% 跳出率：HN drive-by 流量导致，非内容质量问题
- GSC 后台无索引数据：索引报告有 2-7 天延迟
- 中国展示多于美国：可能因 HN 帖子吸引了中国开发者点击，间接触发搜索

---

### 三、下一步工作分析

#### 立即行动（本周内）

1. **优化首页性能**
   - 运行 PageSpeed Insights 诊断 LCP 瓶颈
   - 检查首页是否可 SSR/缓存优化
   - 目标：LCP < 2.5s
   - 优先级：高（影响 Core Web Vitals 和索引速度）

2. **主动提交 IndexNow 加速 Bing 索引**
   - 项目已有 `cardshopdir/scripts/submit-indexnow.ts`
   - 运行提交关键页面（首页、州页、游戏页）到 Bing IndexNow API
   - 优先级：中

3. **监控 HN 流量衰退曲线**
   - 记录 HN 流量每日衰减情况
   - 衰退后的残余流量 = 真实 SEO 基线
   - 优先级：中（数据收集）

#### 本周观察重点

4. **观察索引增长曲线**
   - 每日记录 `site:cardshopdir.com` 结果页数
   - 关注是否持续增长还是停滞
   - 30h ~100 页 → 7 天目标 > 200 页

5. **观察地理长尾词出现**
   - 每日检查 GSC 搜索表现
   - 关注是否出现 "card shops in {city}" / "pokemon store {state}" 类查询
   - 这是 SEO 策略成功的关键信号

6. **观察 GSC 规范化进展**
   - http:// 展示是否减少
   - 是否需要主动在 GSC 提交 https 为首选域名

#### 中期行动（2-4 周）

7. **建立初始外链**
   - HN 帖子已带来一波外链曝光
   - 可考虑：Reddit 相关 subreddit（r/PCMasting, r/pokemonTCG 等）、产品目录站、GitHub README 外链
   - 目标：补充 HN 流量衰退后的外链支撑
   - 注意：避免低质量外链，专注相关社区

8. **内部链接优化**
   - 确保 shop 页 → city 页 → state 页的面包屑链接畅通
   - 帮助 Googlebot 发现更多深层页面
   - 检查是否有 orphan pages（sitemap 有但无内链的页面）

9. **内容质量检查**
   - 抽查已索引的 shop 页面内容质量
   - 确认无 thin content / 重复内容问题
   - 关注 GSC "已抓取 - 尚未编入索引" 数量

#### 暂不需要行动

- ❌ 不急于建外链：先让 Google 自然索引，4 周后再评估
- ❌ 不急于做内容营销：先观察 SEO 自然表现
- ❌ 不急于做 P1 功能开发：等第 8 周 Go/No-Go 决策

---

### 四、与监控清单目标的对比

| 第 1 周目标      | 当前（30h） | 状态      |
| ---------------- | ----------- | --------- |
| GSC sitemap 成功 | 已提交      | ⏳ 待确认 |
| GSC 已索引 > 0   | ~100        | ✅ 超预期 |
| 无服务器错误     | 0 错误      | ✅        |
| Bing 已索引 > 0  | 暂无数据    | ⏳        |
| 首页 200         | 200         | ✅        |
| sitemap 200      | 200         | ✅        |

**第 4 周关键里程碑预警**：

- 目标：索引 > 1,000（当前 ~100，需 10x 增长）
- 30h ~100 页的速度 → 若保持，4 周可达 ~2,800 页，有望达标
- 但索引速度通常会衰减，需持续观察

---

### 五、数据原始文件

- GSC 搜索表现导出：`data/gsc/cardshopdir.com-Performance-on-Search-2026-09-01/`
  - Chart.csv（24h 逐时数据）
  - Queries.csv（关键词）
  - Pages.csv（页面）
  - Countries.csv / Devices.csv

---

## 2026-09-01 20:13 — 首页性能优化完成

### 优化历程

| 阶段         | Mobile Perf | Mobile LCP | Mobile FCP | Mobile SI | 关键改动                                     |
| ------------ | ----------- | ---------- | ---------- | --------- | -------------------------------------------- |
| 初始 PSI     | 79          | 3.9s       | 2.9s       | 5.0s      | -                                            |
| +系统字体    | 83          | 3.7s       | 2.6s       | 4.7s      | 移除 21 个 next/font，消除 woff2 下载        |
| +ISR+CF缓存  | **94**      | **2.9s**   | **1.7s**   | **1.7s**  | force-dynamic→revalidate=3600，CF Cache Rule |
| Desktop 最终 | **100**     | **0.6s**   | **0.5s**   | **0.5s**  | -                                            |

### 三项关键优化

1. **系统字体替代 21 个 Google Fonts**
   - 文件：`app/layout.tsx`、`app/globals.css`
   - CSS 从 22.7KB → 16.9KB（消除 21 个 @font-face）
   - 关键路径从 HTML→CSS→woff2(798ms) 缩短为 HTML→CSS(292ms)
   - 消除 65KB woff2 字体下载

2. **ISR 替代 force-dynamic**
   - 文件：11 个内容页面 `export const revalidate = 3600`
   - `cache-control` 从 `private, no-cache` → `s-maxage=3600, stale-while-revalidate`
   - `x-nextjs-cache: HIT`（Next.js ISR 缓存生效）
   - 州页 51 个 + 游戏页 15 个预渲染为静态 HTML

3. **Cloudflare Cache Rule**
   - 配置 HTML 页面 edge 缓存（排除 /api/ /admin /sign-in /sign-up）
   - `cf-cache-status: HIT`（CF edge 缓存生效）
   - TTFB 从 1-2.7s → ~250ms（PSI 测量）

### 次要优化

- Umami preconnect（350ms 连接预热）
- ShopCard 图片 `sizes="84px"`（避免下载 256px 变体）
- Shop 详情页图片 `sizes="160px"`（主图从 208KB → ~20KB）
- 移除导航 Sign in 入口（暂不需要用户登录）

### 剩余可优化项（非紧急）

- **Unused JavaScript 57KB**：`0_9htn5wasi6n.js`(31.7KB) + `0l1_47-31-frg.js`(25.2KB)，含 polyfill（Array.prototype.at/flat/flatMap 等），可通过 browserslist 配置减少
- **Legacy JavaScript 14KB**：同上 polyfill 问题
- **图片压缩**：featured shop 图片仍有优化空间（PSI 报告 Est savings 46KB mobile / 5KB desktop）
- **Render-blocking CSS**：16.9KB CSS 仍阻塞渲染，可考虑 critical CSS inlining

---

## 2026-09-03 20:00 — 上线 3 天快照

### 一、索引状态

| 指标               | 30h (09-01) | 3 天 (09-03) | 变化             |
| ------------------ | ----------- | ------------ | ---------------- |
| site: 搜索结果页数 | 6 页        | **20 页**    | +233%            |
| 估算索引数         | ~100        | **~200**     | +100%            |
| GSC 后台索引报告   | 暂无数据    | 暂无数据     | 仍有延迟（正常） |

索引速度从 30h ~100 页 → 3 天 ~200 页，持续增长中。Googlebot 抓取活跃。

### 二、GSC 搜索表现（过去 24h）

| 指标             | 30h (09-01) | 3 天 (09-03) | 变化         |
| ---------------- | ----------- | ------------ | ------------ |
| 总点击           | 0           | 0            | 不变（正常） |
| 总展示           | 10          | **148**      | **+1380%**   |
| 有展示的页面数   | 7           | **80+**      | +1043%       |
| 有展示的关键词数 | 2           | **45+**      | +2150%       |
| 平均排名         | 1-10        | **5-12**     | 稳定         |

展示量从 10 → 148，增长 15 倍。这是非常积极的信号 — 说明 Google 正在将网站内容匹配到更多搜索查询。

### 三、关键词分析 — 地理长尾词出现了！

这是本次数据**最重要的发现**。30h 时只有品牌词（店铺名），现在出现了大量地理+品类长尾词：

**"near me" 类查询（目标关键词）**：
| 关键词 | 展示 | 排名 | 重要性 |
|---|---|---|---|
| card shops near me | 4 | 10 | ⭐ 核心 |
| sports card shops near me | 2 | 10 | ⭐ 核心 |
| trading card shop near me | 1 | 5 | ⭐ 核心 |
| tcg card shops near me | 1 | 7 | ⭐ 核心 |
| mtg card shops near me | 1 | 8 | ⭐ 核心 |
| card shop near me | 1 | 9 | ⭐ 核心 |
| game stores near me | 1 | **1** | ⭐⭐ 排名第一！ |
| trading card shops near me | 1 | 8 | ⭐ 核心 |
| card game stores near me | 1 | 57 | 需优化 |
| sports trading card store near me | 2 | 12 | ⭐ 核心 |

**地理+品类查询**：
| 关键词 | 展示 | 排名 |
|---|---|---|
| sports card shops in branson mo | 1 | 43 |
| house of cards el paso tx | 5 | 7 |

**品牌词（店铺名搜索）**：
| 关键词 | 展示 | 排名 |
|---|---|---|
| house of cards el paso tx | 5 | 7 |
| fantasy game center | 4 | 8 |
| spinnerz new braunfels | 3 | 5.67 |
| rainiers tcg shop | 3 | 8 |
| rjbreaks reviews | 3 | 8 |
| hoover house | 3 | 9 |
| grims fiction | 3 | 12.33 |

> **关键发现**：`game stores near me` 排名第 1 位！虽然只有 1 次展示，但说明 Google 认为某个页面与这个查询高度相关。需要确认是哪个页面获得这个排名。

### 四、有展示的页面 Top 10

| 页面                                         | 展示 | 排名 | 页面类型 |
| -------------------------------------------- | ---- | ---- | -------- |
| /directory/il                                | 11   | 5.55 | 州页     |
| /shop/rainers-pok-stop-lafayette-in          | 8    | 6.62 | 店铺页   |
| /directory/ak/fairbanks                      | 8    | 8    | 城市页   |
| /directory/pa/york                           | 8    | 9.75 | 城市页   |
| /directory/tn/cleveland                      | 7    | 5.86 | 城市页   |
| /shop/house-of-cards-el-paso-tx              | 6    | 7.33 | 店铺页   |
| /shop/collectors-corner-nwseattle-seattle-wa | 5    | 4.6  | 店铺页   |
| /shop/fantasy-game-center-presque-isle-me    | 5    | 8    | 店铺页   |
| /directory/oh/gallipolis                     | 5    | 10   | 城市页   |
| /directory/mo/branson                        | 5    | 15.2 | 城市页   |

**页面类型分布**：

- 店铺页：~50 个（占大多数）
- 城市页：~15 个
- 州页：~5 个
- 首页：3 次展示

### 五、地理和设备分布

**地理**：美国 141 (95.3%) ✅ 目标市场正确 | 中国 3 | 印度 2 | 巴西 1 | 新西兰 1

**设备**：Mobile 89 (60%) | Desktop 57 (39%) | Tablet 2 (1%)

### 六、Umami 流量（过去 24h）

| 指标           | 30h (09-01) | 3 天 (09-03) | 变化                |
| -------------- | ----------- | ------------ | ------------------- |
| Visitors       | 231         | **21**       | -91%（HN 流量衰退） |
| Visits         | 245         | 23           | -91%                |
| Views          | 453         | 49           | -89%                |
| Bounce rate    | 75%         | 70%          | -5%                 |
| Visit duration | 1m 10s      | 17s          | -76%                |

**流量来源**：
| 来源 | 30h | 3 天 | 变化 |
|---|---|---|---|
| news.ycombinator.com | 43 (64%) | 2 (40%) | HN 流量基本消退 |
| github.com | 16 (24%) | 2 (40%) | GitHub 流量基本消退 |
| bing.com | 2 (3%) | 1 (20%) | 稳定 |

**HN 流量已如预期衰退**。当前 21 UV/24h 是真实基线流量，主要由搜索引擎和残余外链构成。

**热门页面**：
| 路径 | Visitors | 备注 |
|---|---|---|
| / | 18 (72%) | 首页 |
| /directory/games/pokemon | 2 (8%) | 宝可梦游戏页 |
| /directory | 1 (4%) | 目录首页 |
| /shop/cyren-anime-store-tamarac-fl | 1 (4%) | 店铺页 |
| /shop/fabled-tavern-san-antonio-tx | 1 (4%) | 店铺页 |
| /directory/ca/los-angeles | 1 (4%) | 洛杉矶城市页 |
| /blog | 1 (4%) | 博客 |

### 七、3 天关键发现

#### ✅ 积极信号

1. **地理长尾词出现** — "card shops near me"、"sports card shops near me" 等核心目标关键词开始有展示，说明 Google 理解了网站的主题和地理相关性
2. **`game stores near me` 排名第 1** — 虽然只有 1 次展示，但这是一个重要信号
3. **展示量 15 倍增长** — 从 10 → 148，说明更多页面被索引并匹配到查询
4. **80+ 页面有展示** — 从 7 → 80+，覆盖店铺页、城市页、州页
5. **索引持续增长** — 从 ~100 → ~200，3 天翻倍
6. **美国流量占 95%** — 目标市场匹配正确

#### ⚠️ 需关注

1. **0 点击** — 虽然排名 5-12 位，但还没进前 5，CTR 为 0%。需要排名进前 5-8 才会有点击
2. **首页展示量低** — 首页只有 3 次展示，大部分展示分布在深层页面
3. **http:// 仍有展示** — 2 次展示来自 http:// 版本，301 规范化仍未完成
4. **www 子域名出现** — `www.cardshopdir.com/directory/mi/games/riftbound` 有 1 次展示，需要确认是否有重定向问题
5. **部分排名靠后** — 有些页面排名 50-174，需要时间提升

#### ℹ️ 符合预期

- HN 流量衰退：正常现象，一次性事件流量
- GSC 后台无索引数据：索引报告有 3-7 天延迟
- 0 点击：新站 3 天 0 点击完全正常，通常 1-2 周后开始有点击

### 八、与监控清单目标的对比

| 第 1 周目标 (09/01-09/07) | 当前（3 天） | 状态      |
| ------------------------- | ------------ | --------- |
| GSC sitemap 成功          | 已提交       | ⏳        |
| GSC 已索引 > 0            | ~200         | ✅ 超预期 |
| 无服务器错误              | 0            | ✅        |
| Bing 已索引 > 0           | 暂无数据     | ⏳        |
| 首页 200                  | 200          | ✅        |
| sitemap 200               | 200          | ✅        |

**第 2 周目标预警**（09/08-09/14）：

- 目标：GSC 已索引 > 10 → 当前 ~200 ✅ 已达标
- 目标：GSC 搜索点击 0-5 → 当前 0（正常）
- 目标：GSC 搜索展示 0-50 → 当前 148 ✅ 已超达标
- 目标：Umami 总访问量 10-50 → 当前 21 ✅ 在范围内

**第 4 周里程碑预警**（09/22-09/28）：

- 目标：索引 > 1,000 → 当前 ~200，需 5x 增长
- 按当前速度（~67 页/天），4 周可达 ~1,900 页，有望达标

### 九、下一步建议

1. ~~**观察 `game stores near me` 排名第 1 的页面**~~ — 已确认，见下方分析
2. ~~**检查 www 子域名重定向**~~ — 已修复，见下方记录
3. **继续每日记录索引增长** — 关注是否保持 ~67 页/天的速度
4. **观察点击出现** — 预计 5-10 天后开始有首批点击
5. **提交更多 URL 到 IndexNow** — 加速 Bing 索引

---

## 2026-09-03 — 两个问题修复

### 1. www 子域名 301 重定向修复

**问题**：`www.cardshopdir.com` 返回 200 而非 301 重定向到 `cardshopdir.com`，导致 Google 将 www 和 apex 视为两个独立网站，分散 SEO 权重。GSC 已出现 `www.cardshopdir.com/directory/mi/games/riftbound` 的展示。

**修复**：在 Cloudflare Dashboard → Rules → Page Rules 添加规则：

- URL 匹配：`www.cardshopdir.com/*`
- 动作：Forward URL，301 重定向到 `https://cardshopdir.com/$1`

**验证结果**（2026-09-03）：

| 测试 URL                                                 | 状态码 | 重定向目标                             | 状态        |
| -------------------------------------------------------- | ------ | -------------------------------------- | ----------- |
| `www.cardshopdir.com`                                    | 301    | `https://cardshopdir.com/`             | ✅          |
| `www.cardshopdir.com/directory/ca`                       | 301    | `https://cardshopdir.com/directory/ca` | ✅ 路径保留 |
| `www.cardshopdir.com/shop/game-over-gaming-pensacola-fl` | 301    | `https://cardshopdir.com/shop/...`     | ✅ 路径保留 |

Google 预计 1-2 周内将 www 版本的索引信号合并到 apex 域名。

### 2. `game stores near me` 排名第 1 的页面分析

**确认页面**：`https://cardshopdir.com/shop/game-over-gaming-pensacola-fl`

通过 GSC 过滤器确认，该页面在查询 `game stores near me` 中排名第 1 位（1 次展示，0 点击）。

**页面数据**（数据库查询）：

| 字段     | 值                                 |
| -------- | ---------------------------------- |
| 店铺名   | Game over gaming                   |
| ID       | 2642                               |
| 城市     | Pensacola, FL                      |
| 地址     | 1717 North T Street, 32505         |
| 评分     | 4.9/5（40 条评论）                 |
| 类型     | game_store                         |
| 游戏     | Pokemon, MTG, Yu-Gi-Oh!, Riftbound |
| 营业时间 | 周六/周日 08:00-15:30              |
| 网站     | keepupcards.com                    |

**排名因素分析**：

1. **`shop_type = game_store`** — 页面 title 含 "Game over gaming"，meta description 含 "Trading card game shop"，与 "game stores" 语义高度匹配
2. **JSON-LD 结构化数据完整** — `@type: Store` + 地址 + 评分 + 营业时间，Google 理解为实体店铺
3. **描述内容质量** — AI 生成的 description 包含 "trading card enthusiasts"、"singles, sealed product, supplies"、"Pokémon, Magic: The Gathering" 等关键词
4. **高评分 + 评论数** — 4.9 分 40 评论增加可信度
5. **竞争环境** — Pensacola 中型市场，"game stores near me" 竞争可能不激烈

**可复制机会**：

| 指标                                    | 数值 |
| --------------------------------------- | ---- |
| 已索引的 game_store 类型店铺            | 594  |
| 其中评分 ≥ 4.5 且评论 ≥ 20 的高质量店铺 | 456  |

这 456 个高质量 game_store 页面都有潜力在各自城市获得 "game stores near {city}" 的排名。随着索引增长，预计会有更多类似的长尾词排名出现。

**SEO 策略验证**：此案例证明店铺页的 SEO 策略方向正确 — `shop_type` 分类 + 城市名 + 结构化数据 + 高质量描述 = 匹配 "near me" 查询。

### 3. 清除 keepupcards.com 数据投毒

**问题发现**：在分析 `game stores near me` 排名第 1 的页面时，发现店铺 `game-over-gaming-pensacola-fl` 的 website 字段指向 `https://www.keepupcards.com/shop/game-over-gaming-pensacola-fl`。这不是店铺的真实官网，而是数据源平台 keepupcards.com 的页面 — 我们爬取了该网站的 JSON-LD schema 数据，其中 `website` 字段被填充为 keepupcards 自己的 URL，属于数据投毒。

**影响范围**：

| 指标                                | 数量  | 占比           |
| ----------------------------------- | ----- | -------------- |
| website 指向 keepupcards.com 的记录 | 1,785 | 23.1% of 7,722 |
| 其中已索引的                        | 804   | 24.6% of 3,266 |

**处理方式**：方案 A — 清空 website 字段

```sql
UPDATE shops SET website = NULL
WHERE website ILIKE '%keepupcards.com%';
-- 影响 1,785 行
```

**全字段排查**：清空后检查所有字段确认无残留：

| 字段        | keepupcards 残留数 |
| ----------- | ------------------ |
| website     | 0 ✅               |
| description | 0 ✅               |
| name        | 0 ✅               |
| slug        | 0 ✅               |
| telephone   | 0 ✅               |
| email       | 0 ✅               |
| street      | 0 ✅               |

**缓存更新**：PM2 重启 + Cloudflare Purge Everything，使 ISR 缓存和 CF edge 缓存立即刷新。

**线上验证**（`/shop/game-over-gaming-pensacola-fl`）：

| 检查项              | 结果             |
| ------------------- | ---------------- |
| keepupcards 引用    | 0 ✅             |
| Visit Website 按钮  | 0 ✅（不再显示） |
| Get Directions 按钮 | 1 ✅（正常保留） |
| 电话按钮            | 2 ✅（正常保留） |

**website 字段全量分布**（清理后）：

| 域名           | 总数   | 已索引 | 性质            |
| -------------- | ------ | ------ | --------------- |
| NULL（无网站） | 1,785  | 804    | 已清理          |
| facebook.com   | 952    | 111    | 社交媒体页面    |
| instagram.com  | 81     | 34     | 社交媒体页面    |
| ebay.com       | 33     | 16     | 电商平台        |
| linktr.ee      | 35     | 20     | 链接聚合页      |
| 其他真实官网   | ~4,836 | ~2,281 | ✅ 真实店铺网站 |

> **备注**：facebook/instagram/ebay/linktree 等社交媒体链接暂保留，这些是店铺的社交媒体页面，对用户有一定参考价值。后续可评估是否需要处理。

---

## 2026-09-04 17:00 — 上线第 4 天：首次 GSC 点击 + Bing 数据

### 一、里程碑事件

| 事件                   | 状态                                    |
| ---------------------- | --------------------------------------- |
| 🎉 GSC 首次点击        | 2 clicks（历史零的突破）                |
| 📈 GSC 展示量翻倍      | 141 → 293（24h 环比 +108%）             |
| 🔍 site: 索引数        | ~230（23 页结果 × ~10/页）              |
| 📊 Bing Webmaster 数据 | 首次下载，已有 2 clicks / 113 imp       |
| 🐛 GSC Breadcrumb 报错 | 已修复（Malta 国际店铺 state 为空导致） |

> **索引速度趋势**：30h ~100 → 3 天 ~200 → 4 天 ~230，日均 ~57 页。Googlebot crawl budget 分配积极，预计 30 天内可达 2000+。

### 二、GSC 数据（09-04 报告，过去 24h，与 09-03 部分重叠）

#### 1. 总览对比

| 指标        | 09-03 报告 | 09-04 报告 | 变化                   |
| ----------- | ---------- | ---------- | ---------------------- |
| Clicks      | 0          | **2**      | 🎉 +2                  |
| Impressions | 141        | **293**    | +108%                  |
| CTR         | 0%         | 0.68%      | —                      |
| 平均排名    | 11.16      | 14.64      | 下降（更多长尾词进入） |

#### 2. 首次点击详情

| 页面                                  | Clicks | Imp | CTR | Position |
| ------------------------------------- | ------ | --- | --- | -------- |
| `/shop/game-over-gaming-pensacola-fl` | 1      | 4   | 25% | 46.5     |
| `/directory/co/breckenridge`          | 1      | 2   | 50% | 9.5      |

> **分析**：第一个点击来自 Pensacola 店铺页（排名 46.5，说明用户翻到了第 5 页）；第二个来自 Breckenridge 城市目录页（排名 9.5，接近第一页底部）。城市目录页的排名优势明显。

#### 3. Top Queries（展示量 ≥ 5）

| Query                      | Imp | Position | 类型     |
| -------------------------- | --- | -------- | -------- |
| card shops near me         | 15  | 12.93    | 泛搜索   |
| rjbreaks reviews           | 11  | 8.27     | 品牌搜索 |
| gameslab                   | 6   | 8.33     | 品牌搜索 |
| gmt anime                  | 4   | 9.5      | 品牌搜索 |
| fantasy game center        | 3   | 3.33     | 品牌搜索 |
| trading card shops near me | 3   | 4.33     | 泛搜索   |
| card shop near me          | 2   | 9        | 泛搜索   |

> **观察**：品牌搜索（用户直接搜店铺名）占展示量主力，说明 Google 已开始将店铺名与我们的页面关联。泛搜索 "card shops near me" 排名 12.93，距离第一页还差 3 个位置。

#### 4. Top Pages（展示量 ≥ 8）

| Page                                        | Imp | Position | 页面类型 |
| ------------------------------------------- | --- | -------- | -------- |
| `/shop/games-lab-auckland-auckland`         | 14  | 13.71    | 店铺页   |
| `/shop/rjbreaks-skokie-il`                  | 12  | 11.33    | 店铺页   |
| `/directory/mo/kirksville`                  | 10  | 10.6     | 城市目录 |
| `/shop/fantasy-game-center-presque-isle-me` | 9   | 5.89     | 店铺页   |
| `/shop/battle-bunker-dickinson-nd`          | 9   | 28.56    | 店铺页   |
| `/` (首页)                                  | 9   | 32.33    | 首页     |
| `/directory/il`                             | 8   | 5.25     | 州目录   |
| `/shop/hoover-house-salina-ks`              | 8   | 15.75    | 店铺页   |
| `/shop/house-of-cards-el-paso-tx`           | 8   | 77.5     | 店铺页   |
| `/directory/ca/chico`                       | 7   | 6.29     | 城市目录 |

> **观察**：城市目录页排名普遍较好（5-10），店铺页排名分化大（3-77）。州目录 `/directory/il` 排名 5.25 表现优异。

#### 5. 国家分布

| 国家           | Clicks | Imp | Position |
| -------------- | ------ | --- | -------- |
| United States  | 2      | 266 | 14.64    |
| New Zealand    | 0      | 11  | 7        |
| China          | 0      | 3   | 1        |
| Brazil         | 0      | 2   | 8        |
| Canada         | 0      | 1   | 11       |
| United Kingdom | 0      | 1   | 11       |

> **观察**：新西兰 11 展示来自 Games Lab Auckland（新西兰店铺）。国际数据已开始被 Google 展示。

#### 6. 设备分布

| 设备    | Clicks | Imp | CTR   | Position |
| ------- | ------ | --- | ----- | -------- |
| Desktop | 2      | 134 | 1.49% | 21.01    |
| Mobile  | 0      | 159 | 0%    | 9.25     |

> **⚠️ 关键发现**：Mobile 展示量更高（159 vs 134）但 **0 点击**，而 Desktop 2 点击。Mobile 平均排名 9.25 优于 Desktop 21.01，但 CTR 为 0。可能原因：
>
> 1. Mobile SERP 竞争更激烈（本地 pack、地图等占据首屏）
> 2. Mobile 标题/描述在搜索结果中截断更严重
> 3. Mobile 用户更倾向于点击 Google Maps / Local Pack

#### 7. Search Appearance

**空** — 无 rich results 展示。Breadcrumb 修复后需等待重新索引。

### 三、Bing Webmaster 数据（过去 7 天：9/1 - 9/2）

#### 1. 总览

| 日期     | Clicks | Impressions | CTR       |
| -------- | ------ | ----------- | --------- |
| 2026/9/1 | 2      | 77          | 2.6%      |
| 2026/9/2 | 0      | 36          | 0%        |
| **合计** | **2**  | **113**     | **1.77%** |

#### 2. Top Keywords

| Keyword                                               | Imp | Clicks | Avg Position |
| ----------------------------------------------------- | --- | ------ | ------------ |
| card shops near me                                    | 9   | 0      | **5.44**     |
| baseball card shops near me                           | 3   | 0      | 9.33         |
| trading card shop                                     | 2   | 0      | 7.5          |
| where can i sell my xmen imperial cards in east texas | 2   | 0      | 4.5          |
| https://www.cardsnearby.com/                          | 1   | 1      | 2            |
| www.card shop                                         | 1   | 1      | 1            |

> **关键发现**：Bing 上 "card shops near me" 排名 **5.44**，远优于 Google 的 12.93！Bing 竞争较小，是重要的早期流量来源。2 个点击均来自非常规查询（URL 搜索和模糊搜索）。

### 四、Umami 流量（过去 24h，与 09-03 部分重叠）

| 指标           | 数值   | 环比                |
| -------------- | ------ | ------------------- |
| Visitors       | 28     | -88%（HN 流量消退） |
| Visits         | 33     | —                   |
| Views          | 77     | —                   |
| Bounce rate    | 67%    | 改善（从 75%）      |
| Visit duration | 1m 30s | 改善（从 1m 10s）   |

#### Referrer 分布

| 来源              | Visitors | 占比 | 类型        |
| ----------------- | -------- | ---- | ----------- |
| google.com        | 5        | 50%  | 🎉 自然搜索 |
| github.com        | 2        | 20%  | 外链        |
| search.google.com | 2        | 20%  | Google 搜索 |
| firsto.co         | 1        | 10%  | 外链        |

> **里程碑**：Google 自然搜索首次成为 #1 流量来源（50%），HN/social 流量已完全消退。真实用户开始通过搜索发现网站。

### 五、GSC Breadcrumb 报错修复

#### 问题

GSC 报告 `/shop/gamers-malta-santa-venera` 的 BreadcrumbList 错误：

> Either "name" or "item.name" should be specified (in "itemListElement")

#### 根因

Malta 等国际店铺 `state` 字段为空，导致面包屑第 3 项：

- `name` 为空字符串 `""`
- URL 出现双斜杠 `/directory//santa-venera`

#### 修复

`app/shop/[slug]/page.tsx`：

- 面包屑 JSON-LD：state 为空时跳过 state 和 city 层级
- 可见 nav：同步跳过 state 链接
- metadata title：`[city, state].filter(Boolean).join(", ")` 避免空逗号
- 地址显示：同步处理空 state

修复后面包屑：`Home > Directory > Gamers-Malta`（3 级，无空项）

### 六、www 子域问题追踪

GSC Pages 中出现 `www.cardshopdir.com` 的 URL（如 `/directory/mi/games/riftbound`、首页），说明 www 子域仍被 Google 索引。已设置的 301 Page Rule 需要时间生效，Google 重新索引后应合并到 apex 域。

### 七、关键行动项

| 优先级 | 行动                                                       | 状态                |
| ------ | ---------------------------------------------------------- | ------------------- |
| P0     | Breadcrumb 报错修复                                        | ✅ 已完成           |
| P1     | 监控 Mobile CTR = 0 问题                                   | 🔍 持续观察         |
| P1     | 等待 www 子域 URL 从索引消失                               | ⏳ 301 已设置       |
| P2     | 等待 Breadcrumb rich results 出现                          | ⏳ 修复后需重新索引 |
| P2     | 优化 "card shops near me" 排名（Google 12.93 → 目标 < 10） | 🔍 持续             |

---

## 2026-09-07 — 上线一周总结

### 一、索引状态（GSC Page Indexing 报告）

| 指标         | 数值  | 占比  |
| ------------ | ----- | ----- |
| ✅ 已索引    | 339   | 5.1%  |
| ❌ 未索引    | 6,411 | 94.9% |
| Sitemap 总数 | 6,750 | —     |

#### 未索引原因分解

| 原因                                 | 数量  | 性质                       | 可操作性                |
| ------------------------------------ | ----- | -------------------------- | ----------------------- |
| Discovered - currently not indexed   | 6,300 | Google 已发现 URL 但未爬取 | ⏳ 等待 crawl budget    |
| Crawled - currently not indexed      | 99    | 已爬取但未进索引           | ⚠️ 可能内容质量信号不足 |
| Page with redirect                   | 5     | www → apex 301             | ✅ 正常（301 已生效）   |
| Not found (404)                      | 2     | 不存在的 URL               | 🔍 需排查               |
| Alternate page with proper canonical | 2     | canonical 正确指向主版本   | ✅ 正常                 |
| Excluded by 'noindex' tag            | 1     | noindex 标记               | 🔍 需排查               |

> **分析**：6,300 "Discovered - currently not indexed" 是新站正常状态。Google 已知道这些 URL 存在（通过 sitemap），但 crawl budget 有限，需要 2-8 周逐步爬取。99 "Crawled - currently not indexed" 需关注——这些页面被爬了但没进索引，可能是内容相似度太高或质量信号不足。

### 二、GSC 搜索表现（上线 7 天累计）

#### 1. 每日趋势

| 日期     | Clicks | Impressions | CTR       | Avg Position |
| -------- | ------ | ----------- | --------- | ------------ |
| 08-29    | 0      | 0           | —         | —            |
| 08-30    | 0      | 4           | 0%        | 3.5          |
| 08-31    | 0      | 13          | 0%        | 22.5         |
| 09-01    | 0      | 84          | 0%        | 12.2         |
| 09-02    | 0      | 216         | 0%        | 10.0         |
| 09-03    | 2      | 324         | 0.62%     | 15.4         |
| 09-04    | 3      | 446         | 0.67%     | 12.6         |
| **合计** | **5**  | **1,087**   | **0.46%** | **12.72**    |

> 展示量从 0 → 446/天，7 天累计 1,087。增速明显，但 CTR 0.46% 偏低（行业平均 1-3%），主要因排名在第 2-3 页。

#### 2. 有点击的页面（5 个）

| Page                                         | Clicks | Imp | CTR   | Position |
| -------------------------------------------- | ------ | --- | ----- | -------- |
| `/shop/game-over-gaming-pensacola-fl`        | 1      | 10  | 10%   | 40.5     |
| `/directory/co/breckenridge`                 | 1      | 7   | 14.3% | 7.71     |
| `www.cardshopdir.com/` (www 首页)            | 1      | 4   | 25%   | 38       |
| `/shop/midcoast-sports-exchange-rockland-me` | 1      | 4   | 25%   | 40       |
| `/directory/co/montrose`                     | 1      | 2   | 50%   | 15       |

> **注意**：5 个点击中有 1 个来自 `www.cardshopdir.com/` — www 子域仍在被 Google 展示和点击，301 合并尚未完成。

#### 3. Top Queries（展示量 ≥ 10）

| Query                      | Imp | Position | 类型     |
| -------------------------- | --- | -------- | -------- |
| card shops near me         | 43  | 12.91    | 泛搜索   |
| rjbreaks reviews           | 36  | 7.50     | 品牌搜索 |
| gmt anime                  | 33  | 9.85     | 品牌搜索 |
| fantasy game center        | 13  | 5.08     | 品牌搜索 |
| trading card shops near me | 10  | 6.20     | 泛搜索   |
| battle bunker              | 10  | 8.50     | 品牌搜索 |
| rain delay card co         | 10  | 10.60    | 品牌搜索 |

> **品牌搜索占主导**：7 个高展示词中 5 个是品牌搜索（用户直接搜店铺名）。说明 Google 已将店铺名与我们的页面关联。泛搜索 "card shops near me" 排名 12.91，距第一页差 3 位。

#### 4. 页面类型分布

| 类型                 | 展示页面数 | 备注          |
| -------------------- | ---------- | ------------- |
| `/shop/` 店铺页      | 167        | 占比 71.7%    |
| `/directory/` 目录页 | 63         | 占比 27.0%    |
| `www.` 子域          | 7          | 需合并到 apex |

#### 5. Top 目录页（展示量 ≥ 10）

| Page                       | Imp | Position |
| -------------------------- | --- | -------- |
| `/directory/il`            | 46  | 7.30     |
| `/directory/ak/fairbanks`  | 30  | 7.03     |
| `/directory/pa/york`       | 26  | 8.96     |
| `/directory/tn/cleveland`  | 25  | 9.08     |
| `/directory/wi`            | 19  | 11.95    |
| `/directory/mo/branson`    | 19  | 10.00    |
| `/directory/mo/kirksville` | 17  | 10.29    |
| `/directory/ca/chico`      | 17  | **4.47** |

> **目录页排名优势明显**：州目录和城市目录普遍在 4-11 位，优于店铺页。`/directory/ca/chico` 排名 4.47 接近首屏顶部。

#### 6. Top 店铺页（展示量 ≥ 15）

| Page                                        | Imp | Position |
| ------------------------------------------- | --- | -------- |
| `/shop/rjbreaks-skokie-il`                  | 44  | 9.20     |
| `/shop/gmt-anime-hickory-nc`                | 43  | 13.86    |
| `/shop/fantasy-game-center-presque-isle-me` | 32  | 12.94    |
| `/shop/rain-delay-card-co-arcata-ca`        | 27  | 17.22    |
| `/shop/immortal-gaming-ellsworth-me`        | 24  | 16.46    |
| `/shop/battle-bunker-dickinson-nd`          | 23  | 19.52    |
| `/shop/games-lab-auckland-auckland`         | 21  | 21.52    |
| `/shop/cardsmart-ny`                        | 16  | **5.75** |

#### 7. 设备分布（7 天累计）

| 设备    | Clicks | Imp | CTR   | Position |
| ------- | ------ | --- | ----- | -------- |
| Desktop | 3      | 428 | 0.70% | 18.47    |
| Mobile  | 2      | 652 | 0.31% | 9.27     |
| Tablet  | 0      | 7   | 0%    | 20       |

> **Mobile CTR 改善**：从第 4 天的 0% 升到 0.31%（2 clicks），但仍是 Desktop 的不到一半。Mobile 展示量是 Desktop 的 1.5 倍，排名也更好（9.27 vs 18.47），但 CTR 更低。Mobile SERP 的 Local Pack 竞争是主因。

#### 8. 国家分布

| 国家          | Clicks | Imp   | Position |
| ------------- | ------ | ----- | -------- |
| United States | 4      | 1,011 | 12.72    |
| Japan         | 1      | 2     | 32.5     |
| China         | 0      | 23    | 10.61    |
| New Zealand   | 0      | 16    | 6.69     |
| France        | 0      | 7     | 42.14    |

> 日本 1 个点击（来自 L'oeuf Cube Paris 等法国/日本相关店铺页面）。25 个国家有展示，国际化覆盖已开始。

#### 9. Search Appearance

**空** — 仍无 rich results 展示。Breadcrumb 修复后需等待重新索引。

### 三、Bing Webmaster 数据（7 天累计）

#### 1. Top Keywords

| Keyword                      | Imp | Clicks | Avg Position | 对比 Google  |
| ---------------------------- | --- | ------ | ------------ | ------------ |
| card shops near me           | 31  | 0      | **7.06**     | Google 12.91 |
| card shop                    | 7   | 0      | 5.57         | —            |
| baseball card shops near me  | 3   | 0      | 9.33         | Google 11.00 |
| trading card shops near me   | 3   | 0      | 9.67         | Google 6.20  |
| card store                   | 2   | 0      | 5.00         | —            |
| trading card shop            | 2   | 0      | 7.50         | —            |
| card collector shops near me | 1   | 1      | 5.00         | —            |
| www.card shop                | 1   | 1      | 1.00         | —            |

> **Bing 优势**："card shops near me" 在 Bing 排名 7.06，比 Google（12.91）领先 6 个位置。Bing 竞争较小，是早期流量重要来源。3 个点击累计。

### 四、Umami 流量

#### 1. 过去 7 天

| 指标           | 数值   |
| -------------- | ------ |
| Visitors       | 370    |
| Visits         | 414    |
| Views          | 863    |
| Bounce rate    | 70%    |
| Visit duration | 1m 15s |
| PV / UV        | 2.33   |

#### 2. 过去 24 小时

| 指标           | 数值   | 环比 7 天日均         |
| -------------- | ------ | --------------------- |
| Visitors       | 29     | ~53（下降）           |
| Visits         | 35     | —                     |
| Views          | 110    | —                     |
| Bounce rate    | 51%    | 改善（从 70%）        |
| Visit duration | 2m 32s | 显著改善（从 1m 15s） |

> **质量信号改善**：过去 24h 跳出率从 70% 降到 51%，停留时间从 1m15s 升到 2m32s。说明搜索流量比 HN/social 流量更精准——用户真的在找卡牌店。

### 五、www 子域问题

GSC Pages 中仍有 7 个 `www.cardshopdir.com` URL 在展示，其中 1 个甚至拿到了点击。301 Page Rule 已设置但 Google 尚未完全合并。

| www URL                                                                      | Imp | Position |
| ---------------------------------------------------------------------------- | --- | -------- |
| `www.cardshopdir.com/`                                                       | 4   | 38       |
| `www.cardshopdir.com/directory/mi/games/riftbound`                           | 10  | 24.9     |
| `www.cardshopdir.com/directory/games/digimon`                                | 6   | 10.67    |
| `www.cardshopdir.com/shop/gamescape-san-francisco-ca`                        | 4   | 36.25    |
| `www.cardshopdir.com/shop/sactown-sports-cards-and-memorabilia-elk-grove-ca` | 4   | 162.25   |
| `www.cardshopdir.com/shop/treasure-trove-coin-currency-petoskey-mi`          | 2   | 111      |
| `www.cardshopdir.com/shop/jawbreakers-card-shop-utica-utica-mi`              | 1   | 3        |

> **行动**：需确认 301 是否对所有 www URL 生效，特别是带路径的深层 URL。

### 六、一周趋势总结

| 指标                             | 第 1 天 | 第 4 天 | 第 7 天 | 趋势    |
| -------------------------------- | ------- | ------- | ------- | ------- |
| GSC 日展示                       | 84      | 446     | ~330\*  | 📈 增长 |
| GSC 累计点击                     | 0       | 2       | 5       | 📈 增长 |
| 已索引页面                       | ~100    | ~230    | 339     | 📈 增长 |
| GSC 展示页面数                   | —       | 233     | 232     | ➡️ 稳定 |
| Bing "card shops near me" 排名   | —       | 5.44    | 7.06    | ⬇️ 略降 |
| Google "card shops near me" 排名 | —       | 12.93   | 12.91   | ➡️ 稳定 |
| Umami 跳出率                     | 75%     | 67%     | 51%     | 📈 改善 |
| Umami 停留时间                   | 1m10s   | 1m30s   | 2m32s   | 📈 改善 |

\*第 7 天日展示为估算值，GSC 数据有 1-2 天延迟

### 七、关键行动项

| 优先级 | 行动                                           | 状态          |
| ------ | ---------------------------------------------- | ------------- |
| P0     | 排查 2 个 404 URL + 1 个 noindex URL           | 🔍 待处理     |
| P1     | 确认 www 301 对深层路径 URL 生效               | 🔍 待验证     |
| P1     | 监控 "Crawled - currently not indexed" 99 页   | 🔍 持续观察   |
| P2     | 等待 rich results 出现（Breadcrumb 修复后）    | ⏳ 需重新索引 |
| P2     | 优化 "card shops near me" 排名（12.91 → < 10） | 🔍 持续       |
| P2     | Mobile CTR 改善（0.31% → 目标 1%+）            | 🔍 持续       |

---

## 2026-09-13 — 上线两周总结

### 一、核心指标对比

| 指标                           | 第 1 周 (08-29~09-04) | 第 2 周 (09-05~09-10) | 变化  |
| ------------------------------ | --------------------- | --------------------- | ----- |
| GSC Clicks                     | 5                     | 12                    | +140% |
| GSC Impressions                | 1,087                 | 3,053                 | +181% |
| GSC CTR                        | 0.46%                 | 0.39%                 | -15%  |
| GSC Avg Position               | 12.72                 | ~11.9                 | 改善  |
| 展示页面数                     | 232                   | 1,000                 | +331% |
| 展示查询词数                   | 230                   | 753                   | +227% |
| Bing Clicks                    | 2                     | 5                     | +150% |
| Bing "card shops near me" 排名 | 7.06                  | 7.33                  | 稳定  |

> **第 2 周爆发**：09-10 单日 7 clicks / 1,346 impressions，是上线以来最高日。展示量从日均 ~200 升到 ~500+，Google 索引速度加快。

### 二、GSC 搜索表现（14 天累计）

#### 1. 每日趋势

| 日期     | Clicks | Impressions | CTR       | Position  |
| -------- | ------ | ----------- | --------- | --------- |
| 08-29    | 0      | 0           | —         | —         |
| 08-30    | 0      | 4           | 0%        | 3.5       |
| 08-31    | 0      | 13          | 0%        | 22.5      |
| 09-01    | 0      | 84          | 0%        | 12.2      |
| 09-02    | 0      | 216         | 0%        | 10.0      |
| 09-03    | 2      | 324         | 0.62%     | 15.4      |
| 09-04    | 3      | 446         | 0.67%     | 12.6      |
| 09-05    | 1      | 455         | 0.22%     | 10.6      |
| 09-06    | 2      | 352         | 0.57%     | 10.7      |
| 09-07    | 1      | 283         | 0.35%     | 12.4      |
| 09-08    | 0      | 179         | 0%        | 13.2      |
| 09-09    | 1      | 438         | 0.23%     | 15.2      |
| 09-10    | **7**  | **1,346**   | 0.52%     | 11.9      |
| **合计** | **17** | **4,140**   | **0.41%** | **12.09** |

> **09-10 爆发日**：7 clicks + 1,346 imp，可能是 Google 完成了一批新页面索引后开始展示。

#### 2. 有点击的页面（15 个）

| Page                                         | Clicks | Imp | CTR   | Position | 类型     |
| -------------------------------------------- | ------ | --- | ----- | -------- | -------- |
| `/directory/co/breckenridge`                 | 2      | 13  | 15.4% | 8.46     | 城市目录 |
| `/shop/midcoast-sports-exchange-rockland-me` | 2      | 8   | 25%   | 23       | 店铺页   |
| `/directory/in`                              | 1      | 25  | 4%    | 34.72    | 州目录   |
| `/shop/mogamor-scappoose-or`                 | 1      | 14  | 7.1%  | 8.93     | 店铺页   |
| `/directory/nc/clayton`                      | 1      | 13  | 7.7%  | 9.08     | 城市目录 |
| `/shop/game-over-gaming-pensacola-fl`        | 1      | 12  | 8.3%  | 36.42    | 店铺页   |
| `/directory/co/montrose`                     | 1      | 6   | 16.7% | 11.83    | 城市目录 |
| `/directory/nc/fletcher`                     | 1      | 5   | 20%   | 7        | 城市目录 |
| `www.cardshopdir.com/`                       | 1      | 4   | 25%   | 38       | www 首页 |
| `/shop/grand-slam-mansfield-oh`              | 1      | 3   | 33.3% | 3.67     | 店铺页   |
| `/shop/ts-collectables-richmond-tx`          | 1      | 3   | 33.3% | 7.67     | 店铺页   |
| `/shop/the-warchest-dublin-d`                | 1      | 3   | 33.3% | 8        | 店铺页   |
| `/shop/ftw-game-co-pryor-ok`                 | 1      | 1   | 100%  | 3        | 店铺页   |
| `/shop/louisiana-purchase-natchitoches-la`   | 1      | 1   | 100%  | 4        | 店铺页   |
| `/directory/mi/iron-mountain`                | 1      | 1   | 100%  | 10       | 城市目录 |

> **目录页点击效率高**：8 个目录页拿到 8 clicks（53%），但展示量仅占 364/1000 = 36%。城市目录页 CTR 普遍 7-20%。

#### 3. Top 泛搜索 Queries（展示量 ≥ 5，非品牌）

| Query                       | Clicks | Imp | CTR   | Position | 第 1 周排名 |
| --------------------------- | ------ | --- | ----- | -------- | ----------- |
| card shops near me          | 0      | 172 | 0%    | **9.73** | 12.91       |
| sports card shops near me   | 0      | 76  | 0%    | **9.26** | —           |
| trading card shops near me  | 0      | 43  | 0%    | **8.14** | 6.20        |
| card stores near me         | 1      | 22  | 4.55% | 15.09    | —           |
| card shop                   | 0      | 21  | 0%    | 8.71     | —           |
| card shop near me           | 0      | 18  | 0%    | 8.89     | 9.67        |
| pokemon card shops near me  | 0      | 14  | 0%    | **8.14** | —           |
| pokemon cards near me       | 0      | 14  | 0%    | 11.71    | —           |
| card store near me          | 0      | 10  | 0%    | 13.1     | —           |
| card shops                  | 0      | 9   | 0%    | 8.89     | —           |
| tcg shops near me           | 0      | 8   | 0%    | 6.88     | —           |
| mtg card shops near me      | 0      | 8   | 0%    | 8.12     | —           |
| baseball card shops near me | 0      | 7   | 0%    | 10.14    | —           |

> **🎉 "card shops near me" 突破 top 10**：排名从 12.91 → **9.73**，进入第一页！但 172 展示 0 点击——说明在第 10 位附近仍难获得点击（用户倾向于点击前 5 位或 Local Pack）。

#### 4. Top 品牌搜索 Queries（展示量 ≥ 10）

| Query                                   | Imp | Position | 趋势 |
| --------------------------------------- | --- | -------- | ---- |
| rjbreaks reviews                        | 49  | 7.59     | 稳定 |
| gmt anime                               | 49  | 9.33     | 上升 |
| collectors trading company              | 30  | 7.53     | 新增 |
| immortal gaming                         | 21  | 8.19     | 上升 |
| gameslab                                | 17  | 8.12     | 稳定 |
| fantasy game center                     | 13  | 5.08     | 稳定 |
| pittsburgh pulls                        | 13  | 7.31     | 新增 |
| media vault dayton tn                   | 13  | 9.69     | 上升 |
| grumpy's gaylord michigan               | 12  | 5.58     | 新增 |
| mystical tavern                         | 12  | 6.67     | 新增 |
| rain delay card co                      | 12  | 10.42    | 稳定 |
| dragons den upper lake                  | 12  | 13.75    | 稳定 |
| on the marq                             | 11  | 10.45    | 新增 |
| rain delay arcata                       | 11  | 12.73    | 稳定 |
| battle bunker                           | 10  | 8.5      | 稳定 |
| helena sports and trading cards reviews | 10  | 10.0     | 稳定 |

> **品牌搜索持续增长**：从第 1 周 7 个品牌词 → 第 2 周 16 个品牌词。Google 越来越多地将店铺名与我们的页面关联。

#### 5. 页面类型分布

| 类型                 | 展示页面数 | 占比  |
| -------------------- | ---------- | ----- |
| `/shop/` 店铺页      | 633        | 63.3% |
| `/directory/` 目录页 | 364        | 36.4% |
| `www.` 子域          | 16         | 1.6%  |

> **www 子域仍残留 16 个 URL**，301 合并进度缓慢。

#### 6. Top 目录页（展示量 ≥ 25）

| Page                         | Imp | Position | 点击 |
| ---------------------------- | --- | -------- | ---- |
| `/directory/mi`              | 175 | 11.9     | 0    |
| `/directory/il`              | 123 | 11.49    | 0    |
| `/directory/wi`              | 109 | 11.05    | 0    |
| `/directory/ca`              | 43  | 11.63    | 0    |
| `/directory/ak/fairbanks`    | 39  | **7.67** | 0    |
| `/directory/ar/fayetteville` | 24  | 9.71     | 0    |
| `/directory/pa/york`         | 26  | 8.96     | 0    |
| `/directory/tn/cleveland`    | 25  | 9.08     | 0    |
| `/directory/in`              | 25  | 34.72    | 1    |

> **⚠️ 州目录页高展示零点击**：`/directory/mi` 175 展示 0 点击，排名 11.9（第 2 页顶部）。州目录页排名普遍在 11-12，卡在第一页边缘。

#### 7. 设备分布

| 设备    | Clicks | Imp   | CTR   | Position |
| ------- | ------ | ----- | ----- | -------- |
| Mobile  | 12     | 2,886 | 0.42% | 9.14     |
| Desktop | 5      | 1,241 | 0.40% | 19.89    |
| Tablet  | 0      | 13    | 0%    | 15.54    |

> **Mobile CTR 问题已解决**：从第 1 周 0% → 0.42%，与 Desktop（0.40%）持平。Mobile 贡献 12/17 = 71% 的点击。Mobile 排名 9.14 远优于 Desktop 19.89。

#### 8. 国家分布（展示量 ≥ 10）

| 国家          | Clicks | Imp   | Position |
| ------------- | ------ | ----- | -------- |
| United States | 14     | 3,912 | 12.09    |
| India         | 1      | 14    | 36.86    |
| Japan         | 1      | 4     | 20.75    |
| Ireland       | 1      | 3     | 8.0      |
| New Zealand   | 0      | 52    | 10.69    |
| China         | 0      | 25    | 9.96     |
| Malta         | 0      | 20    | 6.9      |
| France        | 0      | 13    | 41.46    |
| Brazil        | 0      | 9     | 7.56     |

> **50 个国家有展示**，国际化覆盖显著扩大。Malta 20 展示排名 6.9（The Mystical Tavern 等马耳他店铺）。

#### 9. Search Appearance

**仍为空** — 无 rich results 展示。

### 三、Bing Webmaster（累计）

| Keyword                                       | Imp | Clicks | Avg Position |
| --------------------------------------------- | --- | ------ | ------------ |
| card shops near me                            | 52  | 1      | **7.33**     |
| card shop                                     | 9   | 0      | 5.00         |
| fabled tavern                                 | 7   | 0      | 7.86         |
| trading card shops near me                    | 4   | 0      | 9.00         |
| baseball card shops near me                   | 3   | 0      | 9.33         |
| card shop near me lorcana                     | 1   | 1      | 1.00         |
| pokemon card store and acarde in pennsylvania | 1   | 1      | 4.00         |
| card collector shops near me                  | 1   | 1      | 5.00         |
| trading card shops chicago                    | 1   | 1      | 4.00         |

> Bing 累计 7 clicks。"card shops near me" 排名 7.33，稳定在第一页底部。

### 四、Umami 流量（过去 7 天）

| 指标           | 数值 | 对比上周          |
| -------------- | ---- | ----------------- |
| Visitors       | 159  | -57%（370→159）   |
| Visits         | 205  | -50%              |
| Views          | 552  | -36%              |
| Bounce rate    | 62%  | 改善（70%→62%）   |
| Visit duration | 50s  | 下降（1m15s→50s） |

#### Referrer 分布

| 来源             | Visitors | 占比    | 类型        |
| ---------------- | -------- | ------- | ----------- |
| google.com       | 29       | **69%** | 🎉 自然搜索 |
| github.com       | 5        | 12%     | 外链        |
| bing.com         | 4        | 10%     | 自然搜索    |
| search.yahoo.com | 1        | 2%      | 自然搜索    |
| duckduckgo.com   | 1        | 2%      | 自然搜索    |
| chatgpt.com      | 1        | 2%      | AI 引用     |
| dev.summhub.com  | 1        | 2%      | 外链        |

> **Google + Bing 占 79%**：搜索引擎已成为绝对主导流量来源。HN/social 流量完全消退。

#### Top Pages

| Path                              | Visitors | 占比 |
| --------------------------------- | -------- | ---- |
| `/`                               | 89       | 79%  |
| `/shop/gameopolis-idaho-falls-id` | 4        | 4%   |
| `/directory/ca`                   | 3        | 3%   |
| `/directory`                      | 3        | 3%   |
| `/directory/mi`                   | 3        | 3%   |
| `/directory/nc`                   | 3        | 3%   |

> 首页占 79% 流量，说明大部分搜索流量来自首页或用户通过首页浏览。

### 五、关键趋势分析

#### 1. ✅ "card shops near me" 进入 top 10

| 时间点           | Google 排名 | Bing 排名 |
| ---------------- | ----------- | --------- |
| 第 4 天 (09-04)  | 12.91       | 7.06      |
| 第 7 天 (09-07)  | 12.91       | 7.33      |
| 第 14 天 (09-13) | **9.73**    | 7.33      |

Google 排名从 12.91 → 9.73，首次进入第一页。但 172 展示 0 点击——第 10 位 CTR 通常 < 2%。

#### 2. ✅ Mobile CTR 问题已解决

| 时间点   | Mobile CTR | Desktop CTR |
| -------- | ---------- | ----------- |
| 第 4 天  | 0%         | 1.49%       |
| 第 7 天  | 0.31%      | 0.70%       |
| 第 14 天 | **0.42%**  | 0.40%       |

Mobile 不仅追平 Desktop，还略超。Mobile 贡献 71% 的点击。

#### 3. ⚠️ 州目录页卡在 top 11-12

`/directory/mi` (175 imp, pos 11.9)、`/directory/il` (123 imp, pos 11.49)、`/directory/wi` (109 imp, pos 11.05) — 三个州目录页展示量大但都卡在第 2 页顶部，0 点击。突破到 top 10 将带来显著流量。

#### 4. ⚠️ www 子域合并缓慢

从第 7 天的 7 个 www URL → 第 14 天的 16 个 www URL（不增反增，因为更多页面被爬取）。301 已生效但 Google 尚未完成 canonical 合并。

#### 5. ⚠️ Rich Results 仍为空

Breadcrumb 修复已 9 天，但 Search Appearance 仍无数据。可能原因：

- Google 尚未重新索引修复后的页面
- Breadcrumb 结构需要更多已索引页面才能触发 rich results

### 六、下一步建议

| 优先级 | 行动                                                              | 预期效果                                                               |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **P0** | 内链优化：从首页/州目录页添加指向高展示城市目录页的内链           | 提升 `/directory/mi`、`/directory/il`、`/directory/wi` 排名突破 top 10 |
| **P0** | 检查 `/directory/mi` 等州目录页内容质量，确保有足够独特内容       | Google 可能因内容相似度高将州目录页卡在 top 11-12                      |
| **P1** | 在 GSC 手动请求索引高价值页面（`/directory/mi`、`/directory/il`） | 加速 Google 重新评估这些页面                                           |
| **P1** | 持续监控 www 子域 URL 是否开始合并                                | 预计 2-4 周内完成                                                      |
| **P2** | 等待 "card shops near me" 排名从 9.73 继续提升                    | 突破 top 5 后 CTR 将显著提升                                           |
| **P2** | 创建博客内容 targeting "card shops near me" 长尾变体              | 如 "best card shops in Michigan"、"pokemon card shops near me" 等      |
| **P3** | assert 子域 robots.txt 修复                                       | 消除 1 个 404（低优先级）                                              |

---

## 2026-09-13 — P0+P1 SEO 优化执行

### 一、P0：州目录页内容优化

**问题诊断**：`/directory/mi`（175 imp, pos 11.9）、`/directory/il`（123 imp, pos 11.49）、`/directory/wi`（109 imp, pos 11.05）三个州目录页卡在 top 11-12，0 点击。

**根因分析**：

1. **stateIntro() 模板化** — 50 个州的 intro 段落几乎完全相同，只替换了州名、tagline 和 top 3 城市。Google 可能因内容相似度高将州目录页卡在 top 11-12。
2. **首页锚文本为州代码** — "Browse by State" 板块显示 "MI"、"IL" 而非 "Michigan"、"Illinois"，锚文本缺乏语义价值。
3. **无 FAQ 内容** — 州目录页缺少问答内容，无法触发 FAQ rich results。

**改动**：

| 改动                  | 文件                             | 说明                                                                                       |
| --------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| stateIntro 数据驱动   | `lib/directory.ts`               | 新版 stateIntro 接收 shopCount、cityCount、avgRating、totalReviews、topGames，生成独特内容 |
| getTopGamesForState() | `lib/directory.ts`               | 新函数，返回州级游戏分布（非全局）                                                         |
| FAQ 板块 + JSON-LD    | `app/directory/[state]/page.tsx` | 4 个 Q&A + FAQPage 结构化数据                                                              |
| 首页完整州名          | `app/page.tsx`                   | "Browse by State" 锚文本从 "MI" → "Michigan"                                               |

**验证**：

- MI intro: "Our directory covers 244 listed shops, 111 cities, an average rating of 4.6 stars, 44,848+ collector reviews. The most popular games among Michigan's shops are Pokemon (110 shops), Magic: The Gathering (90 shops), Yu-Gi-Oh! (78 shops)..."
- IL intro: "Our directory covers 276 listed shops, 139 cities, an average rating of 4.6 stars, 43,441+ collector reviews. The most popular games among Illinois's shops are Pokemon (134 shops), Magic: The Gathering (113 shops), Yu-Gi-Oh! (88 shops)..."
- 每个州 intro 内容完全不同 ✅
- FAQ 部分存在 ✅
- FAQPage JSON-LD 存在 ✅
- 首页链接锚文本显示完整州名 ✅

**Commit**: `e6a77ad`

### 二、P1：博客内容创建

**目标**：扩大泛搜索覆盖，通过博客文章内链到州/城市目录页提升排名。

**代码改动**：

| 改动              | 文件                       | 说明                                                                             |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------- |
| 修复内链 nofollow | `app/blog/[slug]/page.tsx` | 内链（相对路径/同域）保持 dofollow，外链仍 nofollow。之前所有链接被强制 nofollow |
| sitemap 包含博客  | `app/sitemap.ts`           | 已发布博客文章自动加入 sitemap                                                   |
| 博客首页 SEO      | `app/blog/page.tsx`        | H1 从 "Blog" → "Card Shop Guides & Collector Tips"，meta description 优化        |

**3 篇博客文章**（`scripts/seed-blog-posts.sql`）：

| 文章                                        | Target 关键词                                         | 内链目标                                                                  |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Best Card Shops in Michigan                 | "best card shops in michigan", "card shops michigan"  | `/directory/mi`, `/directory/mi/grand-rapids`, `/directory/mi/lansing` 等 |
| Pokemon Card Shops Near Me: Complete Guide  | "pokemon card shops near me", "pokemon cards near me" | `/directory/games/pokemon`, 各州 pokemon 页面                             |
| How to Find Trading Card Shops in Your Area | "trading card shops near me", "card shops near me"    | `/directory`, top 10 州目录, 游戏目录                                     |

每篇文章 800-1500 字，包含 H2/H3 结构、dofollow 内链到州/城市/游戏目录页。

**线上验证**：

- 3 篇博客文章 HTTP 200 ✅
- 博客列表页显示 3 篇 ✅
- 内链 dofollow（0 个 nofollow） ✅
- BlogPosting JSON-LD ✅
- Sitemap 包含博客（ISR 1 小时内更新） ✅

**Commits**: `c141a2c`, `a297c44`

### 三、待执行

| 优先级 | 行动                                                               | 状态                 |
| ------ | ------------------------------------------------------------------ | -------------------- |
| **P0** | 部署州目录页改动到线上                                             | ✅ 已部署            |
| **P1** | 部署博客文章 + 代码改动                                            | ✅ 已部署            |
| **P1** | GSC 手动请求索引 `/directory/mi`、`/directory/il`、`/directory/wi` | ⏳ 待用户操作        |
| **P1** | GSC 手动请求索引 3 篇博客文章                                      | ⏳ 待用户操作        |
| **P2** | 等待 www 子域 301 合并                                             | ⏳ 2-4 周            |
| **P2** | 等待 Rich Results 出现                                             | ⏳ 需重新索引        |
| **P2** | "card shops near me" 排名提升                                      | ⏳ 9.73 → 目标 top 5 |
| **P3** | assert 子域 robots.txt                                             | ⏳ 低优先级          |

---

## 2026-09-19 — 上线第 20 天：索引突破 2,662 + near-me 进入主增长期

### 一、索引里程碑

| 指标                   | 2026-09-07 | 2026-09-19 |                变化 |
| ---------------------- | ---------: | ---------: | ------------------: |
| GSC 已索引页面         |        339 |  **2,662** | **+2,323（+685%）** |
| Sitemap URL 总数       |      6,750 |      6,677 |                 -73 |
| Sitemap 索引率（粗略） |       5.0% |  **39.9%** |      +34.9 个百分点 |

> 索引增长已经超过第 4 周的 1,000 页目标。当前最大瓶颈不再是“能否被索引”，而是把已索引页面从平均 10–20 位推入前 5，并提高点击率。GSC 导出目录名为 09-19，但 `Chart.csv` 当前最后日期为 09-16，搜索表现判断应视为存在约 2–3 天数据延迟。

### 二、GSC 搜索表现（累计至当前导出可见数据）

| 指标                        |                   数值 |
| --------------------------- | ---------------------: |
| Clicks                      |                 **80** |
| Impressions                 |             **17,489** |
| CTR（按 Chart 日数据口径）  |               约 0.46% |
| 平均排名（按 Chart 日数据） |                约 12.0 |
| 有展示查询词                | 至少 1,000（导出上限） |
| 有展示页面                  | 至少 1,000（导出上限） |

#### 核心结论

1. **泛搜索已经成为明确增长引擎**：可见查询中 `near me` 词 135 个、2,968 展示、8 点击，展示占已导出查询的约 33.6%，加权平均排名 10.33。
2. **主词已进入可收获区间**：`card shops near me` 1,199 展示、1 点击、排名 8.72；`trading card shops near me` 346 展示、排名 8.49；`sports card shops near me` 210 展示、1 点击、排名 9.49；`card shop near me` 200 展示、排名 9.06。
3. **CTR 是当前最明显的损失点**：near-me 词整体约 0.27% CTR，很多查询已经在 7–10 位但仍为 0 点击。目标应先把主词推入前 5，而不是继续盲目增加页面数量。
4. **目录页比店铺页更容易获得点击**：目录页 7,493 展示 / 46 点击，店铺页 9,912 展示 / 33 点击。目录页平均排名约 13.16，店铺页约 13.80；应优先加强州/城市/游戏目录的内链和内容。
5. **`/near-me` 尚未成为主落地页**：仅 7 展示、0 点击、平均排名 27.43。当前 near-me 流量仍分散到 `/directory/in`、州页、城市页和店铺页，说明 Google 尚未把新落地页视为最强结果。

#### 重点页面

| 页面                                           | 展示 | 点击 | 平均排名 | 判断                                      |
| ---------------------------------------------- | ---: | ---: | -------: | ----------------------------------------- |
| `/directory/il`                                |  308 |    1 |    12.25 | 高展示，需冲前 10                         |
| `/directory/mi`                                |  298 |    1 |    12.72 | 高展示，需冲前 10                         |
| `/directory/in`                                |  255 |    1 |    27.80 | 仍承接大量泛 near-me，需导流到 `/near-me` |
| `/directory/wi`                                |  163 |    0 |    11.28 | 接近突破                                  |
| `/directory/ia`                                |  117 |    2 |     9.17 | 当前州页效率最好之一                      |
| `/shop/collectors-trading-company-victoria-tx` |  161 |    0 |     9.35 | 店铺品牌词机会                            |
| `/shop/pittsburgh-pulls-canonsburg-pa`         |  158 |    1 |     8.31 | 已有点击，继续增强实体信息                |
| `/near-me`                                     |    7 |    0 |    27.43 | 新页需要更强内链与重新抓取                |

### 三、Bing Webmaster（09-19 导出）

| 指标           | 09-13 |    09-19 |     变化 |
| -------------- | ----: | -------: | -------: |
| 导出关键词行数 |    47 |       62 |      +15 |
| 展示           |   128 |  **150** |   +17.2% |
| 点击           |     7 |    **7** |     持平 |
| 加权平均排名   |  6.77 | **6.66** | 略有改善 |

| 关键词                        | 展示 | 点击 | 平均排名 |
| ----------------------------- | ---: | ---: | -------: |
| `card shops near me`          |   53 |    1 | **7.36** |
| `trading card shops near me`  |    5 |    0 |     8.40 |
| `baseball card shops near me` |    3 |    0 |     9.33 |
| `card shop`                   |    9 |    0 |     5.00 |

> Bing 仍比 Google 更容易进入第一页，但展示量较小。当前不需要单独做 Bing 页面，保持 IndexNow 和 sitemap 更新即可。

### 四、本轮执行

- `Near Me` 已加入全站桌面端与移动端导航，强化 `/near-me` 的站内链接和重要性信号。
- 保留首页现有的 `/near-me` CTA、sitemap 条目、FAQ/CollectionPage/Breadcrumb JSON-LD，不重复创建页面。

### 五、下一阶段行动（按优先级）

| 优先级 | 行动                                                                                                  | 验收标准                                             |
| ------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| P0     | 强化 `/near-me`：从州页、游戏页、重点城市页增加上下文相关锚文本，不只依赖导航                         | 未来 2–4 周 `/near-me` 展示明显高于 7，排名进入前 20 |
| P0     | 优化 `/directory/il`、`/directory/mi`、`/directory/wi` 的 title/intro/内部链接                        | 3 个州页平均排名进入前 10，CTR 不再长期为 0          |
| P1     | 优化 `card shops near me`、`trading card shops near me`、`sports card shops near me` 的标题与首屏文案 | 主词排名稳定进入前 5，CTR 达到 1%+                   |
| P1     | 检查 GSC Page Indexing 中 2,662 已索引页对应的 `Crawled - currently not indexed` 与重复/低质量页      | 不为低质量重复页继续扩张 sitemap；确认索引率持续上升 |
| P1     | 对前 20 个高展示店铺页补充真实、独特的城市/游戏/营业信息                                              | 品牌词页面 CTR 和点击数提升                          |
| P2     | 继续使用 IndexNow 提交新增/更新的 near-me、州页、游戏页和重点店铺页                                   | Bing 关键词展示持续增长                              |
| P2     | 下次导出优先等待 GSC 数据覆盖 09-17 至 09-19，再比较日趋势                                            | 避免把延迟数据误判为增长停滞                         |

### 六、当前判断

项目已从“索引验证期”进入“排名收获期”。未来两周不建议继续大规模生成新 URL；应集中资源在 `/near-me`、高展示州页和前 10–20 位查询的 CTR/排名提升，并用 GSC 页面/查询交叉数据验证每次改动。
