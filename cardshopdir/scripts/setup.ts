#!/usr/bin/env bun

import { existsSync, copyFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"

const root = join(import.meta.dirname, "..")
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`

function step(label: string) {
  console.log(`\n${cyan("▸")} ${label}`)
}

function run(cmd: string) {
  execSync(cmd, { cwd: root, stdio: "inherit" })
}

function check(cmd: string): boolean {
  try {
    execSync(cmd, { cwd: root, stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

console.log(`\n${cyan("CardShopDir")} — Setup\n${"─".repeat(40)}`)

// 1. Check prerequisites
step("Checking prerequisites...")

if (!check("bun --version")) {
  console.log(red("  ✗ Bun not found. Install: https://bun.sh"))
  process.exit(1)
}
console.log(green("  ✓ Bun"))

if (!check("docker --version")) {
  console.log(red("  ✗ Docker not found. Install: https://docker.com"))
  process.exit(1)
}
console.log(green("  ✓ Docker"))

if (!check("docker compose version")) {
  console.log(red("  ✗ Docker Compose not found."))
  process.exit(1)
}
console.log(green("  ✓ Docker Compose"))

// 2. Install dependencies
step("Installing dependencies...")
run("bun install")

// 3. Environment file
step("Setting up environment...")
const envPath = join(root, ".env")
const examplePath = join(root, ".env.example")

if (!existsSync(envPath)) {
  copyFileSync(examplePath, envPath)
  console.log(green("  ✓ Created .env from .env.example"))
  console.log(
    yellow("  ⚠ Edit .env with your credentials before going to production")
  )
} else {
  console.log(green("  ✓ .env already exists"))
}

// 4. Start Docker
step("Starting Docker containers (PostgreSQL + Redis)...")
run("docker compose up -d")

// 5. Wait for PostgreSQL
step("Waiting for PostgreSQL to be ready...")
let pgAttempts = 0
const maxAttempts = 30
while (pgAttempts < maxAttempts) {
  if (
    check(
      "docker compose exec -T db pg_isready -U cardshopdir -d cardshopdir"
    )
  ) {
    break
  }
  pgAttempts++
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

if (pgAttempts >= maxAttempts) {
  console.log(red("  ✗ PostgreSQL did not become ready in time"))
  process.exit(1)
}
console.log(green("  ✓ PostgreSQL is ready"))

// 5b. Wait for Redis
step("Waiting for Redis to be ready...")
let redisAttempts = 0
while (redisAttempts < 10) {
  if (check("docker compose exec -T redis redis-cli ping")) {
    break
  }
  redisAttempts++
  await new Promise((resolve) => setTimeout(resolve, 500))
}
if (redisAttempts >= 10) {
  console.log(yellow("  ⚠ Redis did not respond — rate limiting may not work"))
} else {
  console.log(green("  ✓ Redis is ready"))
}

// 6. Push database schema
step("Pushing database schema...")
run("bun run db:push")

// 7. Seed database
step("Seeding database...")
run("bun run db:seed")

// 8. Done
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

console.log(`\n${"─".repeat(60)}`)
console.log(green("\n✓ Setup complete!\n"))

console.log(
  `${yellow("① Start the app (in a second terminal, leave it running):")}\n`
)
console.log(`    ${cyan("bun dev")}\n`)
console.log(
  dim(
    `    The dev server will print verification links here when users sign up —\n    keep an eye on it.\n`
  )
)

console.log(`${yellow("② Create your admin account (in your browser):")}\n`)
console.log(`    1. Open ${cyan("http://localhost:3000")}`)
console.log(`    2. Click "Sign up", register with any email + password`)
console.log(
  `    3. Watch the ${cyan("bun dev")} terminal — without Plunk configured,`
)
console.log(
  `       the verification link is printed there. Copy it into your browser`
)
console.log(`       to verify your email.`)
console.log(`    4. Back here, run:\n`)
console.log(`       ${cyan("bun run promote-admin you@example.com")}\n`)
console.log(
  `    5. Sign out and sign back in → the ${cyan("/admin")} link appears.\n`
)

console.log(`${yellow("③ Customize your site:")}\n`)
console.log(
  `    • Site name, pricing, fonts, etc. → ${cyan("/admin/settings")}`
)
console.log(
  `    • Replace ${cyan("public/logo.webp")} and ${cyan("public/logo-dark.webp")} with your logo\n`
)

console.log(`${yellow("④ Connect your services (fill in .env):")}\n`)
console.log(`    ${cyan("Stripe")}       — paid tiers + sponsor checkout`)
console.log(
  `    ${cyan("R2")}           — production image uploads (dev falls back to disk)`
)
console.log(`    ${cyan("Plunk")}        — transactional emails + newsletter`)
console.log(`    ${cyan("OAuth")}        — Google / GitHub sign-in buttons`)
console.log(
  `    ${cyan("Redis")}        — rate limiting (already up via Docker)`
)
console.log(`    ${cyan("Turnstile")}    — CAPTCHA on auth pages`)
console.log(`    ${cyan("Discord")}      — admin alerts on new signups + submissions`)
console.log(`    ${cyan("Plausible")}    — privacy-first web analytics\n`)
console.log(
  dim(
    `    Every variable is commented in .env.example.\n    \n`
  )
)

console.log(`${"─".repeat(60)}\n`)
