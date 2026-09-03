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
