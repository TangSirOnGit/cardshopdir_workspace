export {}

const siteUrl = (
  process.env.BETTER_AUTH_URL || "https://cardshopdir.com"
).replace(/\/+$/, "")
const key = process.env.INDEXNOW_KEY
const endpoint =
  process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow"
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL || `${siteUrl}/sitemap.xml`

if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error(
    "INDEXNOW_KEY must be configured and contain 8-128 letters, numbers, or dashes."
  )
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
}

async function getSitemapUrls(): Promise<string[]> {
  const response = await fetch(sitemapUrl)
  if (!response.ok) {
    throw new Error(`Unable to fetch sitemap (${response.status}).`)
  }

  const xml = await response.text()
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) =>
    decodeXml(match[1])
  )
  const siteOrigin = new URL(siteUrl).origin

  for (const url of urls) {
    if (new URL(url).origin !== siteOrigin) {
      throw new Error(`Sitemap contains a URL outside ${siteOrigin}: ${url}`)
    }
  }

  return [...new Set(urls)]
}

const maxRetries = 6
const retryDelayMs = 30_000

async function submitUrls(urls: string[]): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).hostname,
        key,
        urlList: urls,
      }),
    })

    if (response.status === 200 || response.status === 202) {
      return
    }

    const details = (await response.text()).trim()

    // 403 SiteVerificationNotCompleted is transient — IndexNow hasn't crawled
    // the key file yet. Wait and retry instead of failing immediately.
    if (
      response.status === 403 &&
      details.includes("SiteVerificationNotCompleted") &&
      attempt < maxRetries
    ) {
      console.log(
        `  Key verification pending (attempt ${attempt}/${maxRetries}), retrying in ${retryDelayMs / 1000}s...`
      )
      await Bun.sleep(retryDelayMs)
      continue
    }

    throw new Error(
      `IndexNow rejected a batch (${response.status})${details ? `: ${details}` : "."}`
    )
  }
}

const urls = await getSitemapUrls()
if (urls.length === 0) {
  throw new Error("No URLs found in sitemap.")
}

console.log(`Found ${urls.length} URLs in sitemap. Submitting to IndexNow...`)

const batchSize = 10_000
for (let offset = 0; offset < urls.length; offset += batchSize) {
  const batch = urls.slice(offset, offset + batchSize)
  await submitUrls(batch)
  console.log(
    `Submitted ${offset + batch.length}/${urls.length} URLs to IndexNow.`
  )
}

console.log("Done.")
