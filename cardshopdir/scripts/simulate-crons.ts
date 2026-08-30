/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Dry-run simulation of the full cron lifecycle.
 * Tests scheduling, batch publishing, dofollow logic, empty batch prevention,
 * and highlight cleanup — all in-memory, no DB or network calls.
 *
 * Run: bun run scripts/simulate-crons.ts
 */

import {
  getISOWeek,
  getISOWeekYear,
  addWeeks,
  subWeeks,
  startOfISOWeek,
  setISOWeek,
  setISOWeekYear,
} from "date-fns"

// ── Constants (mirrors lib/constants.ts) ────────────────────────────────────

const FREE_SLOTS_PER_BATCH = 9
const DOFOLLOW_TOP_N = 3
const HIGHLIGHT_DURATION_DAYS = 7

// ── Types ───────────────────────────────────────────────────────────────────

type Tier = "free" | "boost" | "highlight"
type Status = "draft" | "pending" | "revision" | "accepted" | "rejected"

interface Submission {
  id: number
  name: string
  tier: Tier
  status: Status
  scheduledWeek: number | null
  scheduledYear: number | null
  publishedAt: Date | null
  productId: number | null
  createdAt: Date
}

interface Product {
  id: number
  batchId: number
  name: string
  slug: string
  tier: Tier
  position: number
  voteCount: number
  dofollow: boolean
  highlightExpiresAt: Date | null
}

interface Batch {
  id: number
  weekNumber: number
  year: number
}

// ── In-memory DB ────────────────────────────────────────────────────────────

let nextSubId = 1
let nextProductId = 1
let nextBatchId = 1

const subs: Submission[] = []
const prods: Product[] = []
const batchList: Batch[] = []
const logs: string[] = []

let passed = 0
let failed = 0

function log(msg: string) {
  logs.push(msg)
}

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.error(`  ✗ ${label}`)
    failed++
  }
}

// ── Schedule logic (mirrors lib/schedule.ts) ────────────────────────────────

function findNextAvailableWeek(
  tier: Tier,
  now: Date
): { week: number; year: number } {
  const nextWeekDate = addWeeks(now, 1)
  const startWeek = getISOWeek(nextWeekDate)
  const startYear = getISOWeekYear(nextWeekDate)

  if (tier !== "free") {
    return { week: startWeek, year: startYear }
  }

  for (let i = 0; i < 52; i++) {
    const d = addWeeks(nextWeekDate, i)
    const w = getISOWeek(d)
    const y = getISOWeekYear(d)

    const count = subs.filter(
      (s) =>
        s.scheduledWeek === w &&
        s.scheduledYear === y &&
        s.tier === "free" &&
        s.status === "accepted" &&
        !s.publishedAt
    ).length

    if (count < FREE_SLOTS_PER_BATCH) {
      return { week: w, year: y }
    }
  }

  const fallback = addWeeks(now, 52)
  return { week: getISOWeek(fallback), year: getISOWeekYear(fallback) }
}

// ── Simulate: accept a submission (admin action) ────────────────────────────

function acceptSubmission(id: number, now: Date) {
  const sub = subs.find((s) => s.id === id)
  if (!sub) throw new Error(`Sub ${id} not found`)

  sub.status = "accepted"

  if (!sub.scheduledWeek) {
    const schedule = findNextAvailableWeek(sub.tier, now)
    sub.scheduledWeek = schedule.week
    sub.scheduledYear = schedule.year
  }
}

// ── Simulate: boost payment webhook ─────────────────────────────────────────

function simulateBoostPayment(id: number, now: Date) {
  const sub = subs.find((s) => s.id === id)
  if (!sub) throw new Error(`Sub ${id} not found`)

  const schedule = findNextAvailableWeek("boost", now)
  sub.status = "accepted"
  sub.scheduledWeek = schedule.week
  sub.scheduledYear = schedule.year
}

// ── Simulate: highlight payment webhook ─────────────────────────────────────

function simulateHighlightPayment(id: number, now: Date) {
  const sub = subs.find((s) => s.id === id)
  if (!sub) throw new Error(`Sub ${id} not found`)

  const currentWeek = getISOWeek(now)
  const currentYear = getISOWeekYear(now)

  let batch = batchList.find(
    (b) => b.weekNumber === currentWeek && b.year === currentYear
  )
  if (!batch) {
    batch = { id: nextBatchId++, weekNumber: currentWeek, year: currentYear }
    batchList.push(batch)
  }

  const slug = sub.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const product: Product = {
    id: nextProductId++,
    batchId: batch.id,
    name: sub.name,
    slug,
    tier: "highlight",
    position: 0,
    voteCount: 0,
    dofollow: true,
    highlightExpiresAt: new Date(
      now.getTime() + HIGHLIGHT_DURATION_DAYS * 24 * 60 * 60 * 1000
    ),
  }
  prods.push(product)

  sub.status = "accepted"
  sub.publishedAt = now
  sub.productId = product.id
}

// ── Simulate: weekly batch cron ─────────────────────────────────────────────

function simulateWeeklyBatch(now: Date): string[] {
  const cLogs: string[] = []
  const currentWeek = getISOWeek(now)
  const currentYear = getISOWeekYear(now)
  const lastWeek = subWeeks(now, 1)
  const lastWeekNumber = getISOWeek(lastWeek)
  const lastWeekYear = getISOWeekYear(lastWeek)

  // Phase 1: Publish
  const acceptedBoosts = subs.filter(
    (s) =>
      s.status === "accepted" &&
      !s.publishedAt &&
      s.tier === "boost" &&
      ((s.scheduledWeek === currentWeek && s.scheduledYear === currentYear) ||
        !s.scheduledWeek)
  )

  const acceptedFree = subs
    .filter(
      (s) =>
        s.status === "accepted" &&
        !s.publishedAt &&
        s.tier === "free" &&
        ((s.scheduledWeek === currentWeek && s.scheduledYear === currentYear) ||
          !s.scheduledWeek)
    )
    .slice(0, FREE_SLOTS_PER_BATCH)

  const toPublish = [...acceptedBoosts, ...acceptedFree]

  if (toPublish.length === 0) {
    cLogs.push("No accepted submissions — skipping batch.")
  } else {
    let batch = batchList.find(
      (b) => b.weekNumber === currentWeek && b.year === currentYear
    )
    if (!batch) {
      batch = { id: nextBatchId++, weekNumber: currentWeek, year: currentYear }
      batchList.push(batch)
    }

    let position = 0
    for (const sub of toPublish) {
      const slug = sub.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      const product: Product = {
        id: nextProductId++,
        batchId: batch.id,
        name: sub.name,
        slug,
        tier: sub.tier,
        position,
        voteCount: 0,
        dofollow: sub.tier === "boost",
        highlightExpiresAt: null,
      }
      prods.push(product)
      sub.publishedAt = now
      sub.productId = product.id
      cLogs.push(
        `  Published [${sub.tier.toUpperCase()}] ${sub.name} → pos ${position}`
      )
      position++
    }
  }

  // Phase 2: Dofollow for last week (always runs, even if no new batch)
  const lastBatch = batchList.find(
    (b) => b.weekNumber === lastWeekNumber && b.year === lastWeekYear
  )

  if (lastBatch) {
    const batchProducts = prods
      .filter((p) => p.batchId === lastBatch.id)
      .sort((a, b) => b.voteCount - a.voteCount)

    const nonHighlights = batchProducts.filter((p) => p.tier !== "highlight")

    // Reset dofollow
    for (const p of nonHighlights) {
      p.dofollow = false
    }

    // Top 3 by votes
    const top3 = nonHighlights.slice(0, DOFOLLOW_TOP_N)
    for (const p of top3) {
      p.dofollow = true
      cLogs.push(`  Dofollow: ${p.name} (${p.voteCount} votes)`)
    }

    // All boosts guaranteed
    const boosts = nonHighlights.filter(
      (p) => p.tier === "boost" && !top3.includes(p)
    )
    for (const p of boosts) {
      p.dofollow = true
      cLogs.push(`  Dofollow (boost): ${p.name}`)
    }
  }

  return cLogs
}

// ── Simulate: cleanup highlights cron ───────────────────────────────────────

function simulateCleanupHighlights(now: Date): number {
  const expired = prods.filter(
    (p) => p.highlightExpiresAt && p.highlightExpiresAt <= now
  )
  for (const p of expired) {
    p.highlightExpiresAt = null
  }
  return expired.length
}

// ── Helper: create a submission ─────────────────────────────────────────────

function createSub(name: string, tier: Tier, createdAt: Date): Submission {
  const sub: Submission = {
    id: nextSubId++,
    name,
    tier,
    status: tier === "free" ? "pending" : "draft",
    scheduledWeek: null,
    scheduledYear: null,
    publishedAt: null,
    productId: null,
    createdAt,
  }
  subs.push(sub)
  return sub
}

function reset() {
  subs.length = 0
  prods.length = 0
  batchList.length = 0
  nextSubId = 1
  nextProductId = 1
  nextBatchId = 1
}

function getMondayOfWeek(week: number, year: number): Date {
  return startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), year), week))
}

// ════════════════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════════════════

console.log("\n━━━ TEST 1: Empty batch prevention ━━━")
{
  reset()
  const monday = getMondayOfWeek(14, 2026)
  const result = simulateWeeklyBatch(monday)

  assert(
    result.some((l) => l.includes("skipping batch")),
    "Cron logs skip message"
  )
  assert(batchList.length === 0, "No batch created")
  assert(prods.length === 0, "No products created")
}

console.log("\n━━━ TEST 2: Free submission full flow ━━━")
{
  reset()
  const wednesday = new Date(2026, 2, 25) // W13
  const sub = createSub("Cool Tool", "free", wednesday)

  // Admin accepts
  acceptSubmission(sub.id, wednesday)
  const schedule = findNextAvailableWeek("free", wednesday)

  assert(sub.status === "accepted", "Status is accepted")
  assert(
    sub.scheduledWeek === schedule.week,
    `Scheduled to week ${schedule.week}`
  )

  // Cron runs on the scheduled Monday
  const monday = getMondayOfWeek(sub.scheduledWeek!, sub.scheduledYear!)
  simulateWeeklyBatch(monday)

  assert(sub.publishedAt !== null, "publishedAt is set")
  assert(sub.productId !== null, "productId is linked")
  assert(prods.length === 1, "One product created")
  assert(prods[0].dofollow === false, "Free product has no dofollow initially")
}

console.log("\n━━━ TEST 3: Boost auto-accepted at payment ━━━")
{
  reset()
  const now = new Date(2026, 2, 26) // Thursday W13
  const sub = createSub("Boost Tool", "boost", now)

  assert(sub.status === "draft", "Starts as draft")

  // Simulate Stripe webhook
  simulateBoostPayment(sub.id, now)

  assert(sub.status === "accepted", "Auto-accepted after payment (not pending)")
  assert(sub.scheduledWeek !== null, "Scheduled week assigned")

  // Cron runs on scheduled Monday
  const monday = getMondayOfWeek(sub.scheduledWeek!, sub.scheduledYear!)
  simulateWeeklyBatch(monday)

  assert(sub.publishedAt !== null, "Boost is published")
  assert(prods[0].dofollow === true, "Boost has dofollow from the start")
}

console.log("\n━━━ TEST 4: Highlight instant publish ━━━")
{
  reset()
  const now = new Date(2026, 2, 26)
  const sub = createSub("Highlight Tool", "highlight", now)

  simulateHighlightPayment(sub.id, now)

  assert(sub.status === "accepted", "Status is accepted")
  assert(sub.publishedAt !== null, "Published immediately")
  assert(prods.length === 1, "Product created instantly")
  assert(prods[0].dofollow === true, "Highlight has dofollow")
  assert(prods[0].highlightExpiresAt !== null, "Highlight has expiry date")

  const expectedExpiry =
    now.getTime() + HIGHLIGHT_DURATION_DAYS * 24 * 60 * 60 * 1000
  assert(
    prods[0].highlightExpiresAt!.getTime() === expectedExpiry,
    `Expires in ${HIGHLIGHT_DURATION_DAYS} days`
  )
}

console.log("\n━━━ TEST 5: Highlight cleanup cron ━━━")
{
  reset()
  const now = new Date(2026, 2, 20)
  const sub = createSub("Expiring Highlight", "highlight", now)
  simulateHighlightPayment(sub.id, now)

  assert(prods[0].highlightExpiresAt !== null, "Has expiry before cleanup")

  // Run cleanup 3 days later — should not clean
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const cleaned3 = simulateCleanupHighlights(day3)
  assert(cleaned3 === 0, "Not cleaned after 3 days")
  assert(prods[0].highlightExpiresAt !== null, "Still has expiry after 3 days")

  // Run cleanup 8 days later — should clean
  const day8 = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
  const cleaned8 = simulateCleanupHighlights(day8)
  assert(cleaned8 === 1, "Cleaned after 8 days")
  assert(prods[0].highlightExpiresAt === null, "Expiry cleared")
}

console.log("\n━━━ TEST 6: Free slot limit (max 10 per batch) ━━━")
{
  reset()
  const now = new Date(2026, 2, 25)

  // Create 15 free submissions
  for (let i = 0; i < 15; i++) {
    const sub = createSub(`Free Tool ${i + 1}`, "free", now)
    acceptSubmission(sub.id, now)
  }

  // All should be scheduled to the same week (first available)
  const targetWeek = subs[0].scheduledWeek!
  const targetYear = subs[0].scheduledYear!
  const scheduledToSameWeek = subs.filter(
    (s) => s.scheduledWeek === targetWeek && s.scheduledYear === targetYear
  ).length

  assert(scheduledToSameWeek === 10, "First 10 scheduled to same week")

  // The last 5 should overflow to the next week
  const overflow = subs.filter(
    (s) => s.scheduledWeek !== targetWeek || s.scheduledYear !== targetYear
  )
  assert(overflow.length === 5, "5 overflow to next available week")

  // Run cron for target week
  const monday = getMondayOfWeek(targetWeek, targetYear)
  simulateWeeklyBatch(monday)

  const published = subs.filter((s) => s.publishedAt !== null)
  assert(published.length === 10, "Only 10 published this week")
  assert(prods.length === 10, "10 products created")
}

console.log("\n━━━ TEST 7: Dofollow logic (top 3 + boosts) ━━━")
{
  reset()
  const week13 = new Date(2026, 2, 25)

  // Week 13: create 5 free + 1 boost
  const free1 = createSub("Product A", "free", week13)
  const free2 = createSub("Product B", "free", week13)
  const free3 = createSub("Product C", "free", week13)
  const free4 = createSub("Product D", "free", week13)
  const free5 = createSub("Product E", "free", week13)
  const boost1 = createSub("Boosted X", "boost", week13)

  acceptSubmission(free1.id, week13)
  acceptSubmission(free2.id, week13)
  acceptSubmission(free3.id, week13)
  acceptSubmission(free4.id, week13)
  acceptSubmission(free5.id, week13)
  simulateBoostPayment(boost1.id, week13)

  // Publish week 14 (scheduled week)
  const w14monday = getMondayOfWeek(free1.scheduledWeek!, free1.scheduledYear!)
  simulateWeeklyBatch(w14monday)

  assert(prods.length === 6, "6 products in week 14")

  // Simulate votes — Product C gets most, then A, then E
  prods.find((p) => p.name === "Product C")!.voteCount = 15
  prods.find((p) => p.name === "Product A")!.voteCount = 10
  prods.find((p) => p.name === "Product E")!.voteCount = 8
  prods.find((p) => p.name === "Product B")!.voteCount = 3
  prods.find((p) => p.name === "Product D")!.voteCount = 1
  prods.find((p) => p.name === "Boosted X")!.voteCount = 0

  // Run cron for week 15 — processes dofollow for week 14
  const w15monday = addWeeks(w14monday, 1)
  simulateWeeklyBatch(w15monday)

  const prodC = prods.find((p) => p.name === "Product C")!
  const prodA = prods.find((p) => p.name === "Product A")!
  const prodE = prods.find((p) => p.name === "Product E")!
  const prodB = prods.find((p) => p.name === "Product B")!
  const prodD = prods.find((p) => p.name === "Product D")!
  const prodBoost = prods.find((p) => p.name === "Boosted X")!

  assert(prodC.dofollow === true, "Top 1 (Product C) gets dofollow")
  assert(prodA.dofollow === true, "Top 2 (Product A) gets dofollow")
  assert(prodE.dofollow === true, "Top 3 (Product E) gets dofollow")
  assert(prodB.dofollow === false, "Position 4 (Product B) no dofollow")
  assert(prodD.dofollow === false, "Position 5 (Product D) no dofollow")
  assert(
    prodBoost.dofollow === true,
    "Boost always gets dofollow (even 0 votes)"
  )
}

console.log("\n━━━ TEST 8: Boost before free in batch order ━━━")
{
  reset()
  const now = new Date(2026, 2, 25)

  // Free created first, then boost
  const free1 = createSub("Free First", "free", now)
  const boost1 = createSub(
    "Boost Later",
    "boost",
    new Date(now.getTime() + 1000)
  )

  acceptSubmission(free1.id, now)
  simulateBoostPayment(boost1.id, now)

  const monday = getMondayOfWeek(free1.scheduledWeek!, free1.scheduledYear!)
  simulateWeeklyBatch(monday)

  const boostProduct = prods.find((p) => p.name === "Boost Later")!
  const freeProduct = prods.find((p) => p.name === "Free First")!

  assert(
    boostProduct.position < freeProduct.position,
    "Boost appears before free in batch"
  )
}

console.log(
  "\n━━━ TEST 9: Submissions not scheduled for this week are skipped ━━━"
)
{
  reset()
  const now = new Date(2026, 2, 25) // W13

  const sub1 = createSub("This Week", "free", now)
  const sub2 = createSub("Next Week", "free", now)

  acceptSubmission(sub1.id, now)
  acceptSubmission(sub2.id, now)

  // Force sub2 to a different week
  sub2.scheduledWeek = sub1.scheduledWeek! + 1

  const monday = getMondayOfWeek(sub1.scheduledWeek!, sub1.scheduledYear!)
  simulateWeeklyBatch(monday)

  assert(sub1.publishedAt !== null, "sub1 published (correct week)")
  assert(sub2.publishedAt === null, "sub2 NOT published (different week)")
}

console.log(
  "\n━━━ TEST 10: Highlight dofollow persists through batch processing ━━━"
)
{
  reset()
  const w13 = new Date(2026, 2, 23) // Monday W13

  // Highlight published in W13
  const hlSub = createSub("Premium Highlight", "highlight", w13)
  simulateHighlightPayment(hlSub.id, w13)

  const hlProduct = prods.find((p) => p.name === "Premium Highlight")!
  assert(hlProduct.dofollow === true, "Highlight has dofollow after publish")

  // W14 cron processes dofollow for W13
  const w14 = addWeeks(w13, 1)
  simulateWeeklyBatch(w14)

  assert(
    hlProduct.dofollow === true,
    "Highlight keeps dofollow after batch processing"
  )
}

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"━".repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.log("\nSOME TESTS FAILED!")
  process.exit(1)
} else {
  console.log("\nAll tests passed!")
  process.exit(0)
}
