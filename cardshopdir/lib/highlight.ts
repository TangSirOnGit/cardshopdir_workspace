import { codeToHtml } from "shiki"

export async function highlightCode(
  code: string,
  lang = "text",
): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  })
}
