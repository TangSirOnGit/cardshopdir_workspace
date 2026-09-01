# CardShopDir 上线进度日志

> **上线日期**: 2026-08-31 上午
> **域名**: https://cardshopdir.com
> **Sitemap URL 总数**: 6,677

---

## 2026-09-01 19:00 — 上线 30 小时快照

### 一、数据汇总

#### 1. Umami 流量（30h）

| 指标 | 数值 |
|---|---|
| Visitors（UV） | 231 |
| Visits | 245 |
| Views（PV） | 453 |
| Bounce rate | 75% |
| Visit duration | 1m 10s |
| PV / UV | 1.96 |

#### 2. 流量来源（Referrer）

| 来源 | Visitors | 占比 | 类型 |
|---|---|---|---|
| news.ycombinator.com | 43 | 64% | 社交外链（HN 帖子） |
| github.com | 16 | 24% | 外链 |
| google.com | 2 | 3% | 自然搜索 |
| bing.com | 2 | 3% | 自然搜索 |
| stackscope.dev | 1 | 1% | 外链 |
| duckduckgo.com | 1 | 1% | 自然搜索 |
| hacker-news.firebaseio.com | 1 | 1% | HN 相关 |
| siteglass.io | 1 | 1% | 外链 |

> **流量结构分析**：88% 来自 HN + GitHub 外链爆发，属一次性事件流量。
> 自然搜索仅 5 次（google 2 + bing 2 + duckduckgo 1），SEO 基线尚未建立。

#### 3. 索引状态

| 指标 | 数值 | 来源 |
|---|---|---|
| GSC 后台索引数 | 暂无数据 | GSC 索引报告有 2-7 天延迟 |
| site: 估算索引数 | ~100 | `site:cardshopdir.com` 返回 6 页结果 |
| GSC sitemap | 已提交，6,677 URLs | |
| Bing Webmaster | 已提交 | 暂无数据 |

#### 4. GSC 搜索表现（过去 24h）

| 指标 | 数值 |
|---|---|
| 总点击 | 0 |
| 总展示 | 10 |
| CTR | 0% |

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

| 检查项 | 结果 | 备注 |
|---|---|---|
| 首页 HTTPS | 200 | ⚠️ 加载 3.4s，偏慢 |
| HTTP → HTTPS 301 | ✅ | 重定向正常 |
| sitemap.xml | 200 | 6,677 URLs，2.4s |
| robots.txt | ✅ | 允许搜索爬虫，屏蔽 AI 训练，屏蔽 /admin /api |

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

| 第 1 周目标 | 当前（30h） | 状态 |
|---|---|---|
| GSC sitemap 成功 | 已提交 | ⏳ 待确认 |
| GSC 已索引 > 0 | ~100 | ✅ 超预期 |
| 无服务器错误 | 0 错误 | ✅ |
| Bing 已索引 > 0 | 暂无数据 | ⏳ |
| 首页 200 | 200 | ✅ |
| sitemap 200 | 200 | ✅ |

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
