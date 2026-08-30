import { highlightCode } from "./highlight"

const PRE_CODE_RE = /<pre><code(?:\s[^>]*)?>([^]*?)<\/code><\/pre>/g

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
}

function detectLang(code: string): string {
  if (/^\s*(import |export |const |let |var |function |async |await |=>)/.test(code)) return "typescript"
  if (/^\s*(def |class |import |from |print\()/.test(code)) return "python"
  if (/^\s*(package |func |fmt\.)/.test(code)) return "go"
  if (/^\s*#\s/.test(code)) return "bash"
  if (/^\s*\$/.test(code)) return "bash"
  if (/^\s*<[a-zA-Z]/.test(code)) return "html"
  if (/\{[\s\S]*:[\s\S]*\}/.test(code) && /["\w]+\s*:/.test(code)) return "json"
  return "text"
}

/**
 * Wraps every <table>...</table> block in a horizontally scrollable
 * container so narrow viewports don't blow up the article layout while
 * keeping `display: table` (so borders and border-collapse work).
 */
export function wrapTables(html: string): string {
  return html.replace(
    /<table[\s\S]*?<\/table>/g,
    (match) => `<div class="table-scroll">${match}</div>`,
  )
}

export async function transformCodeBlocks(html: string): Promise<string> {
  const matches = [...html.matchAll(PRE_CODE_RE)]
  if (matches.length === 0) return html

  let result = html
  for (const match of matches) {
    const raw = decodeHtmlEntities(match[1])
    const lang = detectLang(raw)
    const highlighted = await highlightCode(raw, lang)

    const wrapper = [
      `<div class="code-block-wrapper" data-lang="${lang}">`,
      `<div class="code-block-header">`,
      `<span class="code-block-lang">${lang}</span>`,
      `<button class="code-block-copy" data-code="${encodeURIComponent(raw)}" aria-label="Copy code">`,
      `<svg class="code-block-copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
      `<svg class="code-block-check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      `</button>`,
      `</div>`,
      highlighted,
      `</div>`,
    ].join("")

    result = result.replace(match[0], wrapper)
  }

  return result
}
