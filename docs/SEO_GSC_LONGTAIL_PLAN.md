# CardShopDir GSC 长尾查询分析与 SEO 优化规划

> 数据来源:`docs/GSC_data/cardshopdir.com-Performance-on-Search-2026-11-04`
> 筛选条件:Web 搜索、最近 3 个月、查询正则 `^(?:\S+\s+){7,}\S+$`(8 词及以上)
> 分析日期:2026-11-04
> 代码核对范围:`app/shop/[slug]`、`app/near-me`、`app/directory/**`、`lib/seo.ts`、`lib/directory.ts`、`lib/db/schema.ts`、`app/sitemap.ts`

---

## 一、数据结论

### 1.1 总体

| 指标 | 数值 |
|------|------|
| 长查询条数 | 约 255 |
| 总展示 | 约 1,100(美国占 90%+) |
| 总点击 | 6(CTR 约 0.5%) |
| 设备 | 移动 837 展示 / 桌面 336 展示;移动平均排名 8.7,桌面 26.7 |
| 页面类型 | `/shop/` 页 148 个、`/directory/` 页 195 个;shop 页贡献约 809 展示,目录页约 459 展示 |
| 趋势 | 9 月初为 0,10 月起稳定在日均 20–50 展示,收录与曝光在爬升,点击未跟上 |

### 1.2 查询的四种意图

| 类型 | 典型查询 | 现状 | 对应页面 |
|------|----------|------|----------|
| A. 店名 + reviews / 地址 / 电话 | `card fellaz sports cards & tcg scottsdale reviews`(111 展示,排名 6.4)、`magic omens - tcg & board games shop`(66 展示,排名 5.9) | 排名第 5–10 位但几乎 0 点击 | `/shop/{slug}` |
| B. near me + 半径 / 营业状态 / 收购 | `trading card shops near me within 5 mi`、`card shops near me that buy pokemon cards`、`card shops near me open now` | 排名 10–50,分散在多个页面 | `/near-me`、`/directory/**` |
| C. 游戏品类 + 购买 / 出售 | `where can i buy lorcana / riftbound / yugioh cards near me`、`where can i sell yugioh cards near me` | 排名 9–50 | `/directory/games/*`、`/directory/{state}/games/*` |
| D. 同名店 + 城市 | `one piece card game official shop {city}`(约 9 条) | 排名 5–12,0 点击 | `/shop/one-piece-card-game-official-shop-*` |

### 1.3 关键判断

1. **A 类是最大的"已有曝光未转化"池**。排名已在 5–10,问题出在 SERP 呈现(title/description)与落地内容,不是权重。
2. **B/C 类不是 8 词长尾本身的问题**,而是 `near me` 意图在站点上没有被产品化:没有定位、没有半径、没有营业状态筛选、没有"收购"数据。
3. **长查询量很小(1,100 展示/3 个月)**,不要据此做大规模新页面;优先做改动小、可复用到所有 shop/目录页的模板级优化。
4. 6 次点击样本太小,只看类型分布,不对单个查询下结论。

---

## 二、代码现状核对(决定"能不能现在做")

| 项目 | 现状 | 位置 |
|------|------|------|
| Shop 页 title | `{name} – Card & Hobby Shop in {city, state} \| Hours, Games, Address`,**不含 "reviews"**,且有 75 字符上限逻辑 | `lib/seo.ts` `shopSeoTitle` |
| Shop 页 description | 模板:`{name} is a {type} in {city}... Find store hours, ratings, directions...`,未体现评分/评价数/营业状态 | `app/shop/[slug]/page.tsx` `buildShopDescription` |
| Shop 页 JSON-LD | 已有 `Store` + `AggregateRating` + `OpeningHoursSpecification` + `geo` + Breadcrumb | 同上 |
| Shop 页 FAQ | **没有** FAQ 区块与 FAQPage schema | 同上 |
| Shop 页评价展示 | 页面显示评分星级和 "(N reviews)",但**没有评价正文**;`shop_reviews` 表已建但**没有任何读写代码使用** | `lib/db/schema.ts`,仅 schema/relations 引用 |
| 店铺是否收购卡片 | **数据库无此字段**(只有 `shop_type`、`shop_games`) | `lib/db/schema.ts` |
| `/near-me` 页 | 静态内容页:搜索框 + 州/游戏链接 + 4 条 FAQ + FAQPage schema;**无定位、无半径、无 open now** | `app/near-me/page.tsx` |
| 经纬度 | `shops.latitude/longitude` 已有,但**无空间索引、无按距离查询** | `lib/db/schema.ts` |
| 全仓 `geolocation` | 无任何使用 | grep 结果 |
| 城市页 | 已有 `cityIntro`、FAQ、FAQPage schema | `app/directory/[state]/[city]/page.tsx` |
| 游戏页 | 已有 FAQ + schema;州×游戏页已存在,**城市×游戏页不存在** | `app/directory/**` |
| 收录控制 | sitemap 只收录 `shouldIndex = true` 的 shop | `app/sitemap.ts` |
| `/directory/search` | `noindex, follow` | `app/directory/search/page.tsx` |
| 已做的历史优化 | 第一批 7 家店自定义 meta、州/城市/游戏页 metadata override | `docs/PROGRESS_LOG.md` |

---

## 三、可以现在做(无需新数据、无需新表、改动在模板层)

### P0-1 Shop 页 title/description 覆盖 "reviews" 与店铺事实

- **为什么**:A 类查询排名 5–10 但 CTR 接近 0;title 里没有 reviews,description 没有评分/营业状态。
- **做法**:
  - `shopSeoTitle`:在候选列表前部增加含 `Reviews` 的版本,如 `{name} – {city, state} | Hours, Reviews & Address`;保持 ≤75 字符,逐级降级。
  - `buildShopDescription`:有评分时拼入 `Rated {x}/5 from {n} reviews`,并列出所售游戏、营业时间摘要;无评分时保持现有模板。
  - 已有 `shop.metaTitle` / `shop.metaDescription` 手写值保持最高优先级,不覆盖。
- **文件**:`lib/seo.ts`、`app/shop/[slug]/page.tsx`、`lib/__tests__/seo.test.ts`(同步更新用例)。
- **风险**:title 改动会触发 Google 重写期,观察 2–4 周再判断。不要同时改 URL 或 canonical。

### P0-2 Shop 页加 "Quick Facts" 摘要块与 FAQ(含 FAQPage schema)

- **为什么**:同时服务 reviews / hours / phone / address / 卖什么游戏这几类意图,并便于被 AI 搜索摘要引用。
- **做法**:
  - 首屏 H1 下方或 About 之前增加一个纯文本事实段,例如:`{name} is a {type} at {street}, {city}, {state}. Rated {x}/5 from {n} reviews. Open today {hours}. Carries {games}.`
  - 新增 FAQ(3–4 条,只用库里已有数据生成):
    - What are the opening hours of {name}?
    - Where is {name} located?
    - What games does {name} carry?
    - What is the phone number of {name}?(有电话才出)
  - 条件渲染:缺哪项数据就不生成对应问题,**避免出空答案**。
  - 追加 `FAQPage` JSON-LD。
- **文件**:`app/shop/[slug]/page.tsx`(可抽成 `components/shop-faq.tsx`)。
- **注意**:FAQ 内容必须与页面可见文本一致,否则不符合 Google 结构化数据规范。

### P0-3 同名官方店(One Piece Card Game Official Shop 等)去重区分

- **为什么**:D 类约 9 条查询,多个页面 title/正文高度相似,易互相蚕食。
- **做法**:
  - 确认这类店 title 已带城市和州(现有 `shopSeoTitle` 已带 `in {city, state}`,需抽查 slug 重复如 `plano-tx-plano-tx`)。
  - 针对这批店,用已有 `scripts/update-seo-first-batch.ts` 的方式,批量写入自定义 `meta_description`(强调所在城市、官方赛事/产品)。
  - 排查 slug 末尾重复(`...-plano-tx-plano-tx`、`...-gurnee-il-gurnee-il`)和 `-1` 后缀(`books-comics-things-fort-wayne-in-1`):**仅排查并记录,不改 slug**(改 slug 需要 301 与 sitemap 同步,放到规划里)。
- **文件**:`scripts/` 下新增批量脚本(沿用第一批脚本格式)、`docs/PROGRESS_LOG.md` 记录。

### P0-4 `/near-me` 页文案对齐真实查询(纯内容,无新功能)

- **为什么**:真实查询里大量出现 `within 5 mi`、`open now`、`that buy cards`、`where can i buy {game} cards near me`、`where can i sell`。
- **做法**:
  - FAQ 扩充 4–6 条,并同步 FAQPage schema:
    - Where can I buy Pokémon / Magic / Yu-Gi-Oh! / Lorcana / One Piece cards near me?
    - How do I find card shops open now?
    - Which card shops are within 5 miles of me?(答案先写用州/城市/邮编查找,待 P1-1 上线后再改为"使用定位")
  - 增加指向热门 `/directory/games/*` 的游戏入口(已有 topGames,补文案即可)。
  - **不要在没有对应功能时承诺 "within 5 mi / open now" 筛选**;只写已有能力(店铺页显示今日营业状态和营业时间)。
- **文件**:`app/near-me/page.tsx`。

### P0-5 游戏页补 "where to buy {game} cards" 意图文案与 FAQ

- **为什么**:C 类查询(lorcana/riftbound/yugioh/one piece)落点在 `/directory/games/*`,排名 9–50。
- **做法**:在游戏页 H1 之下增加 intro,FAQ 增加 `Where can I buy {game} cards near me?`、`Do local card shops sell {game} singles and sealed product?`。Yu-Gi-Oh! 已有自定义 override,沿用。
- **文件**:`app/directory/games/[game]/page.tsx`、`lib/directory.ts`(`gameDisplayName` 等辅助)。
- **边界**:**不要写"收购/sell"的具体承诺**(无数据),仅写购买。

### P0-6 内链强化

- **为什么**:大量目录页排名 40–60,权重不足。
- **做法**:
  - shop 页已有同城/同州链接,补一条 `More {game} shops in {state}` 指向 `/directory/{state}/games/{game}`(这些页面已存在)。
  - 首页和 `/near-me` 增加指向热门 `/directory/{state}/games/{game}` 的入口(取已有数据 top N,避免链接薄页)。
- **文件**:`app/shop/[slug]/page.tsx`、`app/near-me/page.tsx`、`app/page.tsx`。

### P0-7 监控基线

- 记录 P0 改动前的基线(`Pages.csv` 里的 20 个 shop 页和 `/near-me` 的展示/排名/CTR),改动后 28 天对比。
- GSC 过滤改用两套:8 词以上查询(本次)、包含 `reviews|near me|buy|sell` 的查询。
- 写入 `docs/MONITORING_CHECKLIST.md`。

---

## 四、纳入规划(需要新功能、新数据或有明显风险)

### P1-1 `/near-me` 浏览器定位 + 附近店铺

> 你提出的 `navigator.geolocation` 方案,评估如下。

- **SEO 价值**:有限但真实。定位结果是**客户端交互**,Googlebot 看不到,不会直接带来排名。价值是提升停留和转化,让 `near me` 查询的落地页真正兑现承诺,间接改善参与度信号。
- **前置条件**:
  1. 按经纬度查询附近店铺的接口(`/api/shops/nearby?lat=&lng=&radius=`)。可先用 Haversine 在 SQL 里算距离,配合经纬度范围预过滤;店铺约 7,700 家,规模可直接做,不必先上 PostGIS。给 `latitude, longitude` 加复合索引。
  2. 经纬度缺失的店铺需排除(需统计缺失比例)。
  3. 接口加 `lib/rate-limit.ts` 限流(仓库已有)。
- **前端**:
  - `/near-me` 增加"Use my location"按钮,用户点击才请求定位(不在加载时弹授权)。
  - 半径选项 5 / 10 / 20 mi。
  - 拒绝授权时回退到现有搜索框,不影响首屏服务端内容。
  - **首屏服务端 HTML 保持不变**(现有文案、FAQ、州/游戏链接),定位列表作为客户端增强,避免影响 LCP 与收录。
- **隐私**:坐标只用于本次请求,不落库、不写日志。`PRIVACY` 页同步说明。
- **验收**:Lighthouse 无回退;定位拒绝/失败路径可用;接口 p95 延迟达标。
- **依赖**:无新数据。可作为第一个迭代项。

### P1-2 "Open now" / 营业状态筛选

- **现状**:`lib/shop-hours.ts` 已有 `formatTodaySummary` 和 `isOpenNow` 能力,但依赖营业时间数据覆盖率与店铺时区。
- **缺口**:时区字段缺失(`shops` 无 timezone)。无时区则"当前是否营业"可能错误。
- **规划**:先统计 `shop_hours` 覆盖率;按经纬度或州推断时区;再决定是否在列表页提供筛选。**数据不准时宁可不做**,否则是错误承诺。
- 依赖 P1-1 的附近店铺接口。

### P1-3 UGC 评价与 `Review` 结构化数据

- **现状**:`shop_reviews` 表已存在(含审核状态)但**无页面、无 API、无后台审核入口使用**。页面上的评分和评价数来自外部抓取。
- **为什么值得做**:A 类 "reviews" 查询需要页面上有可读的评价内容;现在只有数字没有正文。
- **规划**:
  1. 评价提交(登录用户,每店一条,已有唯一索引)、`pending → approved` 审核(后台已有 admin)。
  2. shop 页展示已审核评价,加 `Review` JSON-LD。
  3. 反垃圾:Turnstile(依赖已有 `@marsidev/react-turnstile`)+ 限流。
- **风险**:冷启动阶段评价量极少,短期对排名无帮助;**不可用生成内容冒充评价**。Google 对自营站点评价的 AggregateRating 有自我评价限制,需只对真实 UGC 评分使用。
- 优先级低于 P0 与 P1-1。

### P1-4 "收购卡片 / sell cards" 数据与专题页

- **需求信号**:`card shops near me that buy pokemon cards`、`where can i sell yugioh cards near me`、`sports card shops near me that buy cards` 在数据中重复出现。
- **缺口**:库里没有"是否收购"字段,**不能凭空生成**。
- **规划**:
  1. `shops` 增加 `buys_cards`(boolean,可空)或 `services` 标签表;数据来源:店主认领(`shop_claims` 流程已有)、抓取店铺描述中的 "we buy / buying / sell your cards" 关键词并人工抽检。
  2. 达到一定覆盖量(例如每个热门州 ≥ 10 家确认数据)后,再上线 `/directory/we-buy-cards` 及州级页。
  3. 数据确认前,P0-4 的 FAQ 只写能做的事。
- 数据库变更需 drizzle 迁移,部署用 `./deploy.sh --migrate`(见 `PROGRESS_LOG.md` 流程)。

### P1-5 城市×游戏组合页(`/directory/{state}/{city}/games/{game}`)

- **信号**:州×游戏页已出现展示(`/directory/mi/games/riftbound` 等);热门城市如 Phoenix、Las Vegas、Los Angeles、Albuquerque、Springfield MO、Louisville 已有城市页展示。
- **风险**:页面数量会爆炸,多数组合只有 1–2 家店,属于薄内容。
- **规划**:仅对 `该城市该游戏 ≥ 3 家店` 的组合生成,并给 `generateStaticParams` + sitemap 加同样阈值;低于阈值返回 404 或 `noindex`。上线前先看州×游戏页(已存在)的表现,有数据再扩。

### P1-6 slug 清理与去重

- **信号**:存在 `...-plano-tx-plano-tx`、`...-gurnee-il-gurnee-il`、`books-comics-things-fort-wayne-in-1` 等 slug。
- **规划**:统计重复 slug 的数量;若量大则生成新 slug,旧 slug 301 到新 slug,更新 sitemap 与内链,并**提交 IndexNow**(仓库已有 `bun run indexnow:submit`)。
- **风险**:改动会重置已有排名信号,只有在重复 slug 影响明显时才做。

### P1-7 国际店铺(克罗地亚、法国)本地化

- **信号**:Magic Omens(克罗地亚,78 展示,排名 6.4)、Cartabaffe(法国,有 1 次点击)。
- **规划**:先只对这几家店写自定义 `meta_description`(可含 `recenzije`、`avis` 等本地词);**不做 hreflang**,因为页面本身仍是英文单语言,hreflang 无意义。
- 当前国际店铺很少,不值得做通用方案。

### P1-8 新内容(博客 / 指南)

- **方向**:`how to sell pokemon cards to a local card shop`、`what to bring when selling trading cards`、`how to find a card shop that buys sports cards`。
- **依赖**:P1-4 数据确认,否则内容无法链接到真实店铺列表。
- 博客系统已存在(`app/blog`,有 state blog generator)。

---

## 五、明确不做

| 事项 | 原因 |
|------|------|
| 在 title/description 里堆 "near me" | 页面是目录而不是用户位置结果,易被判定为关键词堆砌 |
| 批量生成 "within 5/10/20 mi" 静态页 | 距离是动态结果,静态页无意义且会产生大量薄页 |
| 为每个 8 词长查询单独建页 | 总量太小,应通过模板与 FAQ 覆盖 |
| 对没有数据的店铺生成 FAQ 空答案 | 违反结构化数据规范 |
| 编造评价或"收购"属性 | 内容真实性风险 |
| 同时改多个模板后再看数据 | 无法归因,应分批 |

---

## 六、建议实施顺序

| 批次 | 内容 | 预期工作量 | 观察期 |
|------|------|------------|--------|
| 第 1 批 | P0-1、P0-2(shop 模板:title/description/Quick Facts/FAQ) | 小 | 上线后 2–4 周看 `/shop/` 页 CTR |
| 第 2 批 | P0-3、P0-4、P0-5、P0-6、P0-7 | 小–中 | 同上 |
| 第 3 批 | P1-1 定位 + 附近店铺(含 API、限流、隐私文案) | 中 | 看 `/near-me` 参与度与点击 |
| 第 4 批 | P1-4 数据采集与字段、P1-3 UGC 评价(并行立项) | 中–大 | 数据量达标再上专题页 |
| 第 5 批 | P1-2、P1-5、P1-6、P1-7、P1-8 | 视数据而定 | 按各自信号决定 |

每批上线流程沿用现有约定:迁移 → 脚本 → 部署 → 清 Cloudflare HTML 缓存 → `bun run indexnow:submit` → 在 `docs/PROGRESS_LOG.md` 记录。

## 七、验收指标

- `/shop/` 页(排名 ≤10 的 20 个页面):CTR 从约 0.5% 提升到 ≥2%(以 28 天窗口对比)。
- `/near-me`:展示和排名上升;启用 P1-1 后统计"使用定位"点击率与回退率。
- 8 词以上查询的展示量:10 月日均 20–50 → 持续上升。
- 无回归:Lighthouse 性能分、Core Web Vitals、sitemap 收录数不下降。

## 八、数据局限

- 样本小,点击仅 6 次;所有结论以类型分布为准。
- GSC 会隐藏匿名低频查询。
- 本次仅分析 8 词以上查询,不代表全部流量;短词(如 `card shops near me`)仍需结合 `docs/SEO_ANALYSIS_0915.md` 的 SEMrush 数据。
