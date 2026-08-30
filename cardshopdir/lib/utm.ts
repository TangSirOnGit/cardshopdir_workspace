import { SITE_DOMAIN } from "@/config"

export function appendUtm(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.searchParams.set("utm_source", SITE_DOMAIN)
    return url.toString()
  } catch {
    return rawUrl
  }
}
