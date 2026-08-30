/**
 * Umami event tracking utility.
 * Safe to call in any environment — no-ops when Umami is not loaded
 * (dev, admin, or ad-blocked).
 */

type UmamiWindow = Window & {
  umami?: {
    track: (eventName: string, props?: Record<string, string | number | boolean>) => void
  }
}

/**
 * Track a custom event in Umami.
 * Silently no-ops if Umami script isn't loaded (dev, admin, blocked).
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return
  const w = window as UmamiWindow
  if (!w.umami) return
  try {
    w.umami.track(eventName, props)
  } catch {
    // Silently ignore tracking errors
  }
}
