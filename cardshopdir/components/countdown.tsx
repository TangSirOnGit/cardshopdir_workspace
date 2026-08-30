"use client"

import { useSyncExternalStore } from "react"
import { nextMonday } from "date-fns"

function getTimeLeft() {
  const now = new Date()
  const next = nextMonday(now)
  // Batch cron runs at 06:00 UTC every Monday
  next.setUTCHours(6, 0, 0, 0)

  const diff = next.getTime() - now.getTime()
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds }
}

let listeners: Array<() => void> = []
let currentTime: { days: number; hours: number; minutes: number; seconds: number } | null = getTimeLeft()

function subscribe(listener: () => void) {
  listeners.push(listener)
  const interval = setInterval(() => {
    currentTime = getTimeLeft()
    listeners.forEach((l) => l())
  }, 1000)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
    if (listeners.length === 0) clearInterval(interval)
  }
}

function getSnapshot() {
  return currentTime
}

function getServerSnapshot() {
  return null
}

export function Countdown() {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!time) return null

  return (
    <span className="text-[13px] tabular-nums text-muted-foreground">
      {time.days}d {String(time.hours).padStart(2, "0")}h {String(time.minutes).padStart(2, "0")}m {String(time.seconds).padStart(2, "0")}s
    </span>
  )
}
