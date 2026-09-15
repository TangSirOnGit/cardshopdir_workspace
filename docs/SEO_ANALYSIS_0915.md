# CardShopDir SEMrush 关键词分析报告（上线 2 周）

> 数据来源：`data/semrush/Organic Search Positions-0915.txt`（369 个关键词，去重后 310 条记录）
> 分析日期：2026-09-15

---

## 一、整体表现概览

| 指标 | 数值 |
|------|------|
| 进入 SEMrush 视野的关键词总数 | 369（310 条去重记录） |
| 排名 1-10 位 | 1 个 |
| 排名 11-20 位 | 20 个 |
| 排名 21-30 位 | 53 个 |
| 排名 31-50 位 | 129 个 |
| 排名 51-100 位 | 107 个 |
| "near me" 类关键词 | 33 个（总搜索量 **91,570**） |

**核心结论**：上线仅 2 周就有 369 个关键词进入 SEMrush 追踪，说明索引和收录速度良好。但绝大多数关键词排名在 31-100 位（共 236 个，占 76%），**几乎还没有真实流量**。最大的机会在于：把 21-50 位的 182 个关键词推进到前 20 位。

---

## 二、最重要的发现：`/directory/in` 成了"万能 near me 落地页"

### 问题本质

`/directory/in`（印第安纳州目录页）承载了 **18 个关键词、总搜索量 101,640**，是全站聚合搜索量最高的页面。其中绝大多数是**全国性 "near me" 关键词**，与印第安纳州毫无关系：

| 关键词 | 搜索量 | 当前排名 | KD% | 应该指向的页面 |
|--------|--------|----------|-----|----------------|
| card stores near me | 27.1K | 52 / 49 | 21 | 全国 near-me 落地页 |
| pokemon card store near me | 6.6K | 87 | 43 | 全国 near-me 落地页 |
| pokemon shops near me | 6.6K | 80 | 50 | 全国 near-me 落地页 |
| card trade shop near me | 5.4K | 49 | **10** | 全国 near-me 落地页 |
| trading card stores | 4.4K | 62 | 44 | 全国/目录首页 |
| trading cards stores | 4.4K | 56 | 57 | 全国/目录首页 |
| trading card shops | 2.9K | 87 | 34 | 全国/目录首页 |
| trading cards store near me | 2.4K | 69 | 49 | 全国 near-me 落地页 |
| pokemon trading cards near me | 1.6K | 49 | 60 | 全国 near-me 落地页 |
| pokemon trading card stores near me | 1.3K | 64 | **5** | 全国 near-me 落地页 |
| **local card shops** | **3.6K** | **18** | **16** | 全国 near-me 落地页 |
| cardshop near me | 720 | 38 | 20 | 全国 near-me 落地页 |
| pokemon trading card shops near me | 260 | 43 | 18 | 全国 near-me 落地页 |
| pokemon card shops near me within 5 mi | 170 | 24 | **9** | 全国 near-me 落地页 |
| best pokemon card shops near me | 170 | 41 | 55 | 全国 near-me 落地页 |

**为什么 Google 选了 `/directory/in`？** 因为站点目前**没有专门的全国性 "near me" 落地页**。首页 `/` 虽然标题含 "Near You"，但内容是通用目录首页，没有针对 "card stores near me" 这类查询做语义聚焦。Google 只能退而求其次，从州级页面里挑了一个（IN 是字母排序靠前、shop 数量较多的州）。

**这是当前最大的 SEO 机会**：33 个 near-me 关键词总搜索量 91,570，只要有一个专门的落地页，就有机会把排名从 50-80 位整体推进到 20-30 位甚至首页。

---

## 三、值得优化的页面（按优先级）

### 优先级 1：新建全国性 "near me" 落地页（最高 ROI）

**目标关键词集群**（总搜索量 91,570）：
- card stores near me (27.1K)
- pokemon card store near me / pokemon shops near me (各 6.6K)
- card trade shop near me (5.4K, KD 仅 10)
- local card shops (3.6K, KD 16, **已排到第 18 位**)
- pokemon trading card stores near me (1.3K, KD 仅 5)
- cardshop near me (720)
- pokemon card shops near me within 5 mi (170, KD 9)

**建议做法**：
1. 新建 `/near-me` 或 `/card-shops-near-me` 页面，或重构首页 `/` 使其成为 near-me 落地页
2. 页面 H1: "Card Shops Near Me" / "Find Trading Card Shops Near You"
3. 内容聚焦：解释如何用目录查找附近店铺，展示热门城市/州快捷入口，嵌入搜索框
4. 加入 FAQ（"How do I find card shops near me?" 等）+ FAQPage JSON-LD
5. `local card shops` 已在第 18 位且 KD 仅 16，是最容易突破到首页的关键词，优先围绕它做内容

### 优先级 2：`/directory/in` 页面本身需要优化

既然 Google 已经把大量流量导向它，应该顺势强化：
- 当前 state 页面已有 `stateIntro`、FAQ、JSON-LD，结构不错
- 但 `/directory/in` 的标题是 "Trading Card Shops in Indiana (IN)"，与它实际排名的 near-me 关键词不匹配
- 建议：保持州页面定位，但通过内部链接把 near-me 权重传递给新的全国落地页

### 优先级 3：`/directory/games/yu-gi-oh` 游戏目录页

**10 个关键词，总搜索量 9,140**，是游戏类目录中表现最好的：

| 关键词 | 搜索量 | 排名 | KD% |
|--------|--------|------|-----|
| yugioh card shops near me | 2.4K | 63 / 57 | 32 |
| yugioh cards near me | 2.4K | 37 | 34 |
| yugioh shops near me | 590 | 62 / 56 | 41 |
| yugioh shop near me | 320 | 52 / 44 | 50 |
| yugioh card shops arlingtion | 320 | 79 / 70 | **15** |
| yugioh trading card store | 210 | 51 | 67 |
| card shops near me yugioh | 90 | 43 / 29 | 24 |
| where can i buy yugioh cards near me | 90 | 43 | 38 |

**建议**：
- `yugioh cards near me` 已在第 37 位，KD 34，值得优化到前 20
- 游戏页面当前标题 "Shops selling Yu-Gi-Oh!"，可改为 "Yu-Gi-Oh! Card Shops Near Me — [State/Nationwide]"
- 为每个游戏页面增加 near-me 语义内容、FAQ、城市列表

### 优先级 4：城市目录页（50 个关键词）

表现较好的城市页面：

| 页面 | 关键词示例 | 搜索量 | 排名 |
|------|-----------|--------|------|
| `/directory/ut/lehi` | game grid lehi / gamegrid lehi | 6.6K + 2.4K | 42 / 31 / 44 |
| `/directory/il` | trading card store / baseball card city peoria | 6.6K + 320 | 52 / 66 |
| `/directory/wa/renton` | shane's cards | 2.9K | 60 / 33 |
| `/directory/ny` & `/directory/ny/new-york` | trading cards nyc / trading card shops nyc / baseball card dealers nyc | 110-140 各 | 49-82 |
| `/directory/ca/san-diego` | card shop san diego / tcg stores san diego / trading card shops san diego / san diego trading card stores | 320-390 各 | 34-49 |
| `/directory/ca/san-mateo` | gator games san mateo / gator games & hobby san mateo | 590 各 | 53 / 58 |
| `/directory/ny/patchogue` | the card collective ny / card collective ny / the card collective ny reviews | 720+90 | 23-24 |

**建议**：
- 城市页面当前结构较简单（只有 shop 列表 + game 交叉链接），缺少 SEO 文案
- 为高价值城市页面增加：城市级 intro 段落、FAQ、附近城市交叉链接
- `/directory/ny/new-york` 有多个 NYC 相关关键词（trading cards nyc, trading card shops nyc, baseball card dealers nyc），应重点优化

### 优先级 5：品牌词 shop 页面（215 个关键词，长尾流量基础）

品牌词是数量最多的关键词类型（215 个），大多在 31-50 位。这些是**低 KD 长尾词**，优化成本低：

**已进入前 20 位的品牌词（20 个）**：
- duncan's sports cards (pos 10, KD 11) ← 唯一进入前 10 的
- ichooseyou tcg (pos 13, KD 38)
- scroll and circuit games (pos 14, KD 22)
- omega frog comics (pos 15, KD 34)
- derby comics and games (pos 14, KD 28)
- rets card utopia (pos 15, KD 30)
- miniature market - rock hill (pos 16, KD 34)
- just imagine baraboo wi (pos 16, KD 31)
- emerald knights burbank (pos 19, KD 35)
- shufflers den (pos 19, KD 28)
- t's collectables (pos 19, KD 29)
- community cards attleboro (pos 19, KD 30)
- 等等

**建议**：
- shop 页面 SEO 基础已不错（有 LocalBusiness JSON-LD、breadcrumb、附近店铺交叉链接）
- 可优化点：`metaDescription` 字段（当前很多 shop 没有自定义 description，用的是默认模板）
- 为排名 21-30 的 53 个关键词对应的 shop 页面补充更丰富的 description、about 文案

---

## 四、低 KD 高搜索量机会清单（KD ≤ 20 且搜索量 ≥ 300）

这些是**性价比最高的优化目标**——竞争度低、搜索量可观：

| 关键词 | 搜索量 | 排名 | KD% | 落地页 |
|--------|--------|------|-----|--------|
| card trade shop near me | 5.4K | 49 | 10 | /directory/in |
| local card shops | 3.6K | 18 | 16 | /directory/in |
| pokemon trading card stores near me | 1.3K | 64 | 5 | /directory/in |
| orb sports cards & collectibles | 1K | 27 | 17 | shop 页 |
| chicagoland games dice dojo north broadway chicago il | 880 | 40 | 17 | shop 页 |
| cardshop near me | 720 | 38 | 20 | /directory/in |
| game force pokemon card store | 720 | 45 | 17 | shop 页 |
| davis cards and games davis ca | 480 | 44 | 18 | /directory/ca/davis |
| yugioh card shops arlingtion | 320 | 79 / 70 | 15 | /directory/games/yu-gi-oh |

---

## 五、具体优化行动建议

### A. 立即执行（1-2 周）

1. **新建全国 near-me 落地页** `/near-me`（或重构首页）
   - H1: "Card Shops Near Me — Find Trading Card Stores in Your Area"
   - 聚焦 `local card shops`（已第 18 位，KD 16）作为主关键词
   - 次要关键词：card stores near me, cardshop near me, card trade shop near me
   - 内容：搜索框 + 热门州/城市快捷入口 + FAQ + 如何使用指南
   - 加入 FAQPage + WebSite（SearchAction）JSON-LD

2. **优化 `/directory/games/yu-gi-oh`**
   - 标题改为 "Yu-Gi-Oh! Card Shops Near Me & Across the US"
   - 增加 near-me 语义 intro 段落和 FAQ
   - 目标：把 `yugioh cards near me`（第 37 位）推进到前 20

3. **为高价值城市页面增加 SEO 文案**
   - 优先：`/directory/ny/new-york`、`/directory/ca/san-diego`、`/directory/ca/san-mateo`
   - 增加城市级 intro（类似 stateIntro）、FAQ、附近城市链接

### B. 中期执行（2-4 周）

4. **补充 shop 页面的 metaDescription 和 description**
   - 当前 shop 页面 description 用默认模板，很多为空
   - 为排名 21-50 位的 shop 页面批量生成含城市+游戏类型的 description

5. **新建 city + game 组合页面** `/directory/[state]/[city]/games/[game]`
   - 当前缺失这一层，但 SEMrush 显示有需求（如 "pokemon card shops sacramento" → /directory/ca/sacramento）
   - 可捕获 "pokemon card shops [city]"、"yugioh shops [city]" 等长尾

6. **强化内部链接结构**
   - 首页 → near-me 页面 → state → city → shop 的层级链接
   - game 页面 ↔ city 页面双向交叉链接

### C. 长期执行（持续）

7. **博客内容营销**
   - 当前 blog 未见关键词表现，说明博客内容未被索引或无搜索量
   - 撰写 "Best Card Shops in [City/State]" 系列文章，承接长尾搜索
   - 撰写 "How to Find Pokemon Card Shops Near Me" 等指南文章

8. **监控与迭代**
   - 每周导出 SEMrush 数据，跟踪 near-me 关键词排名变化
   - 重点监控 `local card shops`、`card trade shop near me`、`yugioh cards near me` 这三个最接近首页的关键词

---

## 六、技术 SEO 现状评估

已做好的：
- ✅ sitemap.xml 覆盖 state/city/game/shop/blog 页面
- ✅ robots.txt 配置合理（屏蔽 admin/api/auth）
- ✅ 每个页面有 canonical URL
- ✅ state 页面有 FAQ + FAQPage JSON-LD + CollectionPage JSON-LD + Breadcrumb JSON-LD
- ✅ shop 页面有 LocalBusiness JSON-LD + Breadcrumb JSON-LD
- ✅ 首页有 SearchAction JSON-LD
- ✅ 面包屑导航齐全
- ✅ ISR（revalidate=3600）保证内容新鲜

需要改进的：
- ❌ 缺少全国性 near-me 落地页（最大缺口）
- ❌ 城市页面缺少 SEO 文案/FAQ/JSON-LD（只有基础 CollectionPage）
- ❌ 游戏页面缺少 near-me 语义优化
- ❌ 缺少 city+game 组合页面
- ❌ shop 页面 metaDescription 大量缺失
- ❌ 博客内容未产生搜索流量

---

## 七、预期收益估算

如果优先级 1（near-me 落地页）执行到位：
- `local card shops`（3.6K，第 18 位）→ 进入前 10，预计月流量 +30-50
- `card trade shop near me`（5.4K，第 49 位，KD 10）→ 进入前 20，预计月流量 +20-40
- `card stores near me`（27.1K，第 52 位）→ 进入前 30，预计月流量 +15-30
- `pokemon trading card stores near me`（1.3K，第 64 位，KD 5）→ 进入前 20，预计月流量 +10-20

near-me 关键词集群整体有 91,570 月搜索量，即使只拿到 0.1% 的 CTR，也有 ~90 月访问量，远超当前水平。
