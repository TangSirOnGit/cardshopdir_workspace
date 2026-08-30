import "server-only"

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity"
import filter from "leo-profanity"

// ── Setup ─────────────────────────────────────────────────────────

// obscenity: English with evasion detection (leet speak, unicode, spacing tricks)
const englishMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
})

// leo-profanity: load all available languages on top of each other
const LEO_LANGUAGES = [
  "en", "fr", "es", "de", "it", "pt", "ru", "ar", "zh", "ja",
  "ko", "nl", "pl", "tr", "th", "vi", "id", "sv", "da", "fi",
  "no", "cs", "hu", "ro", "uk", "hi",
]

// Start with default EN, then merge every language's word list
filter.loadDictionary()
for (const lang of LEO_LANGUAGES) {
  try {
    filter.loadDictionary(lang)
    const words = filter.list()
    filter.loadDictionary()
    filter.add(words)
  } catch {
    // language not available, skip
  }
}

// ── Types ─────────────────────────────────────────────────────────

interface ModerationResult {
  allowed: boolean
  reason?: string
}

// ── Main check ────────────────────────────────────────────────────

export function moderateComment(body: string): ModerationResult {
  const trimmed = body.trim()

  if (trimmed.length < 2) {
    return { allowed: false, reason: "Comment is too short" }
  }

  if (trimmed.length > 1000) {
    return { allowed: false, reason: "Comment is too long" }
  }

  // Profanity — English (evasion-resistant: leet speak, unicode, spaces)
  if (englishMatcher.hasMatch(trimmed)) {
    return { allowed: false, reason: "Comment contains inappropriate language" }
  }

  // Profanity — all languages (leo-profanity merged dictionary)
  if (filter.check(trimmed)) {
    return { allowed: false, reason: "Comment contains inappropriate language" }
  }

  // Link spam: more than 2 URLs
  const urlCount = (trimmed.match(/https?:\/\//gi) ?? []).length
  if (urlCount > 2) {
    return { allowed: false, reason: "Too many links" }
  }

  // Repeated characters: "aaaaaaa" or "!!!!!!!"
  if (/(.)\1{7,}/i.test(trimmed)) {
    return { allowed: false, reason: "Comment contains excessive repetition" }
  }

  // ALL CAPS abuse (text > 20 chars and > 70% uppercase)
  if (trimmed.length > 20) {
    const letters = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, "")
    if (letters.length > 0) {
      const upperRatio = letters.replace(/[^A-ZÀ-Ý]/g, "").length / letters.length
      if (upperRatio > 0.7) {
        return { allowed: false, reason: "Please don't write in all caps" }
      }
    }
  }

  // Duplicate word spam: same word repeated 5+ times and > 50% of message
  const words = trimmed.toLowerCase().split(/\s+/)
  if (words.length >= 5) {
    const freq = new Map<string, number>()
    for (const w of words) {
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
    for (const [, count] of freq) {
      if (count >= 5 && count / words.length > 0.5) {
        return { allowed: false, reason: "Comment looks like spam" }
      }
    }
  }

  return { allowed: true }
}

// ── Spam heuristics ───────────────────────────────────────────────

export function isSpamSubmission(honeypot: string, formLoadedAt: number): boolean {
  if (honeypot) return true
  if (Date.now() - formLoadedAt < 3000) return true
  return false
}
