import GithubSlugger from "github-slugger"

export type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

/**
 * Parses sanitized blog HTML, injects stable `id` attributes on every h2/h3,
 * and returns the TOC for the sidebar. Runs on the server before Shiki.
 */
export function extractToc(html: string): { html: string; toc: TocItem[] } {
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []

  const processed = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_match, level, inner) => {
      const text = inner.replace(/<[^>]+>/g, "").trim()
      if (!text) return `<h${level}>${inner}</h${level}>`
      const id = slugger.slug(text)
      toc.push({ id, text, level: Number(level) as 2 | 3 })
      return `<h${level} id="${id}">${inner}</h${level}>`
    },
  )

  return { html: processed, toc }
}
