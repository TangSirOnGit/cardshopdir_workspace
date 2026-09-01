# 把一个 Next.js 网站从 79 分优化到 94 分：我是怎么做的

> 上线一个新网站后，我用 PageSpeed Insights 跑了一下，移动端性能得分 79 分。经过三轮优化，最终提升到 94 分，桌面端达到满分 100。这篇文章记录了完整的诊断过程和每一步的改动，希望对同样在做性能优化的朋友有帮助。

## 先看结果

| 指标 | 优化前 | 优化后 | 变化 |
|---|---|---|---|
| 移动端性能得分 | 79 | **94** | +15 |
| 移动端 LCP | 3.9s | **2.9s** | -1.0s |
| 移动端 FCP | 2.9s | **1.7s** | -1.2s |
| 移动端 Speed Index | 5.0s | **1.7s** | -3.3s |
| 桌面端性能得分 | 99 | **100** | +1 |
| 桌面端 LCP | ~1s | **0.6s** | -0.4s |

其中 Speed Index 从 5.0 秒降到 1.7 秒，降幅 66%，是改善最显著的指标。

---

## 背景

网站是 [CardShopDir](https://cardshopdir.com) — 一个美国交易卡牌店铺目录站，收录了 7,700+ 家店铺，技术栈是 Next.js 16 + Turbopack + PostgreSQL，部署在 VPS 上，前面套了一层 Cloudflare。

上线后我用 Google 的 [PageSpeed Insights](https://pagespeed.web.dev/) 测试了首页，移动端得分 79。这个分数不算差，但对于一个以 SEO 为核心的目录站来说，页面速度直接影响搜索引擎排名和用户体验，所以我决定把它优化到 90 分以上。

---

## 诊断：找到瓶颈在哪里

性能优化的第一步永远是**测量**，而不是盲目改代码。PageSpeed Insights 的报告比我想象的有用得多，它不仅给分数，还告诉你时间花在了哪里。

### LCP 分解：时间到底花在哪了

LCP（Largest Contentful Paint）是衡量"用户看到页面主要内容需要多久"的指标。PSI 报告里有一个 "LCP breakdown" 把它拆成了几个部分：

```
LCP 总时间: 3.9 秒
├── TTFB（服务器响应）:     110ms  ✅ 很快
└── Element render delay:  2,470ms  ❌ 问题在这
```

TTFB 只有 110ms，说明服务器响应不是问题。但"元素渲染延迟"高达 2.47 秒 — 意思是浏览器拿到了 HTML，但迟迟画不出主要内容。

### 网络依赖树：为什么会延迟

PSI 还提供了一个关键信息叫 "Network dependency tree"（网络依赖树），它展示了浏览器加载页面时资源的依赖链：

```
HTML 文档 (450ms)
  └── CSS 文件 (584ms, 22.7KB)
        └── 字体文件 woff2 #1 (798ms, 48.75KB)
        └── 字体文件 woff2 #2 (798ms, 16.14KB)
```

这条链的意思是：浏览器必须先下载 HTML，然后从 HTML 中发现 CSS 链接并下载 CSS，然后从 CSS 中发现字体链接并下载字体。整个过程是串行的，总耗时 798ms。

但 798ms 还不足以解释 2.47 秒的渲染延迟。真正的杀手是：**CSS 是渲染阻塞资源**。浏览器在下载和解析完 CSS 之前，不会渲染任何内容。而我的 CSS 文件里有 21 个 `@font-face` 声明，浏览器解析完 CSS 后还要再下载字体文件，字体没下完之前，文字就不会显示。

LCP 元素是首页的一段文字（hero 区域的描述段落），它必须等字体加载完才会渲染。这就是 2.47 秒延迟的根源。

---

## 第一轮优化：砍掉自定义字体

### 问题根源

在 `app/layout.tsx` 里，我定义了 **21 个 Google Fonts 字体**（11 个无衬线 + 10 个衬线），通过 `next/font/google` 加载：

```typescript
// 简化后的代码结构
import { Inter, DM_Sans, Plus_Jakarta_Sans, /* ... 还有 18 个 */ } from "next/font/google"

const fontInter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false })
const fontDmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", preload: false })
// ... 还有 19 个类似的定义
```

为什么会有 21 个字体？因为网站有一个后台管理页面，管理员可以从下拉菜单里选择不同的字体组合。为了支持这个功能，所有字体都需要在构建时准备好。

虽然我设了 `preload: false`（避免浏览器预加载所有字体），但 Next.js 仍然会把所有 21 个字体的 `@font-face` 声明写进 CSS 文件。结果就是：

- CSS 文件 125KB（压缩后 22.7KB），里面有 21 个 `@font-face`
- 浏览器下载 CSS 后，虽然只加载选中的 2 个字体，但解析 21 个 `@font-face` 声明仍然有开销
- 那 2 个选中的字体文件（woff2）在关键路径上，额外增加 798ms

### 解决方案：用系统字体

系统字体栈是每个操作系统自带的字体，不需要下载。比如 iOS 上的 San Francisco、Android 上的 Roboto、Windows 上的 Segoe UI。用 CSS 的 `system-ui` 关键字就能自动匹配：

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
               Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
```

改动很简单：
1. 删掉 `layout.tsx` 里所有 `next/font/google` 的 import 和字体定义（删了约 190 行代码）
2. 在 `globals.css` 的 `:root` 里加上系统字体栈

### 效果

| 指标 | 改动前 | 改动后 |
|---|---|---|
| CSS 大小 | 22.7KB | **16.9KB**（-25%）|
| @font-face 声明 | 21 个 | **0** |
| woff2 下载 | 65KB | **0** |
| 关键路径 | HTML→CSS→woff2 (798ms) | **HTML→CSS (292ms)** |

移动端性能从 79 → 83，LCP 从 3.9s → 3.7s。改善有但不如预期大 — 因为还有另一个瓶颈在等着。

---

## 第二轮优化：让 CDN 缓存页面

### 发现真正的大问题

第一轮优化后，LCP 只降了 0.2 秒。我重新检查了 TTFB，这次用 `curl` 连续请求了 5 次：

```
请求1: ttfb:1.35s
请求2: ttfb:2.21s
请求3: ttfb:1.24s
请求4: ttfb:1.39s
请求5: ttfb:2.09s
```

TTFB 在 1-2.2 秒之间剧烈波动！这和 PSI 报告里的 110ms 完全不同。

原因很清楚：PSI 测试时碰巧命中了 Next.js 的内部缓存，而我的 curl 测试打到了未缓存的请求。真正的问题是 — **每个页面请求都在服务器上重新渲染**。

检查响应头确认了这一点：

```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
cf-cache-status: DYNAMIC
```

`no-cache, no-store` 告诉 Cloudflare："不要缓存这个页面"。所以即使 Cloudflare 在前面，每个请求都要穿过 CF → Nginx → Next.js → PostgreSQL，完整跑一遍服务端渲染。首页有 9 个数据库查询，每次请求都跑一遍。

### 根因：force-dynamic

在 11 个页面的代码里，都有这一行：

```typescript
export const dynamic = "force-dynamic"
```

这行代码告诉 Next.js："每次请求都重新服务端渲染，不要缓存"。这在开发时很方便，但对生产环境的内容页面来说是性能杀手。

这些页面的数据（店铺总数 7,722、州数 51、热门城市）变化频率极低 — 可能一周才变一次。完全不需要每次请求都重新查数据库。

### 解决方案：ISR（增量静态再生）

把 `force-dynamic` 改成 `revalidate = 3600`（1 小时重新验证）：

```typescript
// 改动前
export const dynamic = "force-dynamic"

// 改动后
export const revalidate = 3600
```

ISR 是 Next.js 的一个功能：页面在第一次请求时生成静态 HTML，之后直接返回缓存的 HTML，每小时在后台重新生成一次。这样既保证了数据新鲜度，又避免了每次请求都查数据库。

改完后，响应头变成了：

```
cache-control: s-maxage=3600, stale-while-revalidate=31532400
x-nextjs-cache: HIT
```

`s-maxage=3600` 告诉 CDN："这个页面可以缓存 1 小时"。`x-nextjs-cache: HIT` 说明 Next.js 已经在用缓存的 HTML 响应了。

### 还需要 Cloudflare 配合

但 Cloudflare 默认不缓存 HTML 页面（`text/html`），即使 `cache-control` 允许。所以还需要在 Cloudflare Dashboard 添加一条 Cache Rule：

> **规则**：匹配所有路径，排除 `/api/`、`/admin`、`/sign-in`、`/sign-up`
> **动作**：Eligible for cache，Edge TTL = 3600 秒

配置后：

```
cf-cache-status: HIT
age: 94
```

`cf-cache-status: HIT` 说明 Cloudflare edge 节点已经在返回缓存的 HTML，请求根本不会到达 VPS。

### 效果

| 指标 | 第一轮后 | 第二轮后 |
|---|---|---|
| 移动端性能 | 83 | **94** |
| 移动端 LCP | 3.7s | **2.9s** |
| 移动端 FCP | 2.6s | **1.7s** |
| 移动端 Speed Index | 4.7s | **1.7s** |
| TTFB（PSI 测量） | ~1s | **247ms** |
| 关键路径 | HTML→CSS (292ms) | **HTML→CSS (292ms)，但 HTML 只需 247ms** |

Speed Index 从 4.7s 降到 1.7s 是最大的惊喜 — 因为页面现在能瞬间从 CDN 返回，所有内容都更早呈现给用户。

---

## 第三轮：一些小优化

除了两个大改动，还做了几个小调整：

### 1. Preconnect 优化

PSI 报告指出网站有一个无用的 `preconnect`（指向自己），同时缺少对分析工具 Umami 的 `preconnect`。修复后节省了 350ms 的连接建立时间。

### 2. 图片尺寸优化

首页的 featured shop 卡片显示 84×84 像素的图片，但 `next/image` 组件没有设置 `sizes` 属性，导致浏览器下载了 256×256 的源图。加上 `sizes="84px"` 后，`next/image` 会自动生成更小的 srcset 变体，图片体积大幅减少。

### 3. 移除登录入口

导航栏的 "Sign in" 按钮对访客没有用，移除后页面更简洁，也减少了一个客户端组件的渲染。

---

## 经验总结

### 1. 先测量，再优化

PSI 报告的 "LCP breakdown" 和 "Network dependency tree" 是最有价值的诊断工具。没有它们，我可能会去优化 TTFB（看起来 1-2 秒很慢），而忽略了真正的瓶颈是字体渲染延迟。

### 2. 自定义字体的隐性成本

`next/font` 很方便，但每个字体都会往 CSS 里塞一个 `@font-face` 声明。21 个字体 = 21 个声明 = CSS 膨胀 + 字体文件在关键路径上。对于内容型网站，系统字体完全够用，而且零下载成本。

如果确实需要自定义字体，建议：
- 只加载 1-2 个字体
- 用 `font-display: swap` 让文字先显示
- 考虑只加载用到的字重

### 3. force-dynamic 是性能杀手

`export const dynamic = "force-dynamic"` 在开发时很方便，但生产环境的内容页面几乎不需要它。ISR（`revalidate = N`）能在保持数据新鲜度的同时获得静态页面的性能。

### 4. CDN 缓存需要显式配置

即使你的响应头写了 `s-maxage=3600`，Cloudflare 默认也不会缓存 HTML。需要在 Dashboard 里加 Cache Rule 才能让 edge 节点缓存页面。这一步很容易被忽略。

### 5. 移动端和桌面端可能需要不同的优化策略

我的桌面端从一开始就是 99 分，优化到 100 分几乎没有感知差异。但移动端从 79 → 94 是质的飞跃。PSI 用的是慢速 4G + 中端 Android 设备模拟，这更接近真实用户的体验。

---

## 还能继续优化吗？

94 分已经是个不错的成绩，但如果想冲 100 分，还有几个方向：

1. **减少未使用的 JavaScript**：PSI 报告显示有 57KB 的未使用 JS（主要是 polyfill），可以通过配置 `browserslist` 只支持现代浏览器来减少
2. **Critical CSS inlining**：把首屏需要的 CSS 内联到 HTML 里，消除 CSS 的渲染阻塞
3. **图片格式优化**：部分图片可以进一步压缩，或使用 AVIF 格式

不过这些属于边际优化，投入产出比不如前两轮高。对于 SEO 目录站来说，94 分已经足够了。

---

*本文记录的优化于 2026-09-01 完成，网站 [cardshopdir.com](https://cardshopdir.com) 持续运行中。*
