"use client"

import { useState, useTransition } from "react"
import { saveSettings } from "./actions"
import { sileo } from "sileo"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SETTINGS_DEFINITION,
  SETTINGS_GROUPS,
  type SettingKey,
} from "@/lib/settings-shared"

interface SettingsFormProps {
  values: Record<SettingKey, string>
}

const LAUNCH_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const FONT_OPTIONS_SANS = [
  { value: "inter", label: "Inter" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "plus-jakarta-sans", label: "Plus Jakarta Sans" },
  { value: "outfit", label: "Outfit" },
  { value: "manrope", label: "Manrope" },
  { value: "sora", label: "Sora" },
  { value: "albert-sans", label: "Albert Sans" },
  { value: "nunito-sans", label: "Nunito Sans" },
  { value: "work-sans", label: "Work Sans" },
  { value: "rubik", label: "Rubik" },
]

const FONT_OPTIONS_SERIF = [
  { value: "instrument-serif", label: "Instrument Serif" },
  { value: "playfair-display", label: "Playfair Display" },
  { value: "lora", label: "Lora" },
  { value: "source-serif-4", label: "Source Serif 4" },
  { value: "crimson-pro", label: "Crimson Pro" },
  { value: "libre-baskerville", label: "Libre Baskerville" },
  { value: "merriweather", label: "Merriweather" },
  { value: "eb-garamond", label: "EB Garamond" },
  { value: "fraunces", label: "Fraunces" },
  { value: "dm-serif-display", label: "DM Serif Display" },
]

const DAY_TO_CRON: Record<string, string> = {
  monday: "1",
  tuesday: "2",
  wednesday: "3",
  thursday: "4",
  friday: "5",
  saturday: "6",
  sunday: "0",
}

// ── Unit conversions ─────────────────────────────────────────────────────
// DB stores cents / seconds internally. The form shows dollars / minutes
// and converts back on save.

interface UnitConversion {
  fromDb: (v: string) => string // DB value → display value
  toDb: (v: string) => string // display value → DB value
  prefix?: string
  suffix?: string
  step?: string
}

// ── Input filtering & validation ─────────────────────────────────────────
// Defines which characters are accepted per field and value constraints.

const DECIMAL_FIELDS = new Set([
  "boost_price_cents",
  "highlight_price_cents",
  "sponsor_base_price_cents",
])

/** Only allow digits (and optionally one dot for decimal fields) */
function filterNumericInput(raw: string, allowDecimal: boolean): string {
  if (allowDecimal) {
    // Strip everything except digits and dots, keep only first dot
    const cleaned = raw.replace(/[^\d.]/g, "")
    const parts = cleaned.split(".")
    return parts.length <= 2 ? cleaned : parts[0] + "." + parts.slice(1).join("")
  }
  return raw.replace(/\D/g, "")
}

function filterTwitterHandle(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15)
}

interface ValidationError {
  key: string
  message: string
}

function validateForm(form: Record<string, string>): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [key, def] of Object.entries(SETTINGS_DEFINITION)) {
    const val = form[key] ?? def.default

    if (def.type === "number") {
      const num = Number(val)
      if (val !== "" && (isNaN(num) || val.trim() === "")) {
        errors.push({ key, message: `${def.label} must be a valid number.` })
        continue
      }

      if (key === "launch_hour_utc" && (num < 0 || num > 23 || !Number.isInteger(num))) {
        errors.push({ key, message: "Hour must be a whole number between 0 and 23." })
      } else if (key === "sponsor_max_discount" && (num < 0 || num > 100)) {
        errors.push({ key, message: "Discount must be between 0 and 100%." })
      } else if (num < 0) {
        errors.push({ key, message: `${def.label} cannot be negative.` })
      }
    }

    if (key === "contact_email" && val !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errors.push({ key, message: "Enter a valid email address." })
      }
    }
  }

  return errors
}

const UNIT_CONVERSIONS: Partial<Record<string, UnitConversion>> = {
  boost_price_cents: {
    fromDb: (v) => (Number(v) / 100).toFixed(2),
    toDb: (v) => String(Math.round(Number(v) * 100)),
    prefix: "$",
  },
  highlight_price_cents: {
    fromDb: (v) => (Number(v) / 100).toFixed(2),
    toDb: (v) => String(Math.round(Number(v) * 100)),
    prefix: "$",
  },
  sponsor_base_price_cents: {
    fromDb: (v) => (Number(v) / 100).toFixed(2),
    toDb: (v) => String(Math.round(Number(v) * 100)),
    prefix: "$",
    suffix: "/ day",
  },
  sponsor_max_discount: {
    fromDb: (v) => String(Math.round(Number(v) * 100)),
    toDb: (v) => (Number(v) / 100).toFixed(4),
    suffix: "%",
  },
  votes_window_seconds: {
    fromDb: (v) => String(Math.round(Number(v) / 60)),
    toDb: (v) => String(Number(v) * 60),
    suffix: "min",
  },
}

export function SettingsForm({ values }: SettingsFormProps) {
  // Initialize form with display-converted values
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [key, val] of Object.entries(values)) {
      const conv = UNIT_CONVERSIONS[key]
      initial[key] = conv ? conv.fromDb(val) : val
    }
    return initial
  })
  const [isPending, startTransition] = useTransition()
  const [isDirty, setIsDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(key: string, value: string) {
    // Filter input based on field type
    const def = SETTINGS_DEFINITION[key as SettingKey]
    let filtered = value

    if (def?.type === "number") {
      filtered = filterNumericInput(value, DECIMAL_FIELDS.has(key))
    } else if (key === "twitter_handle") {
      filtered = filterTwitterHandle(value)
    }

    setForm((f) => ({ ...f, [key]: filtered }))
    setErrors((e) => {
      if (!e[key]) return e
      const next = { ...e }
      delete next[key]
      return next
    })
    setIsDirty(true)
  }

  function handleSave() {
    const validationErrors = validateForm(form)
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {}
      for (const err of validationErrors) map[err.key] = err.message
      setErrors(map)
      sileo.error({ title: validationErrors[0].message })
      return
    }

    startTransition(async () => {
      try {
        // Convert display values back to DB format
        const payload: Record<string, string> = {}
        for (const [key, val] of Object.entries(form)) {
          const conv = UNIT_CONVERSIONS[key]
          payload[key] = conv ? conv.toDb(val) : val
        }
        await saveSettings(payload)
        setIsDirty(false)
        setErrors({})
        sileo.success({ title: "Settings saved" })
      } catch {
        sileo.error({ title: "Failed to save settings" })
      }
    })
  }

  const cronDay = DAY_TO_CRON[form.launch_day] ?? "1"
  const cronHour = form.launch_hour_utc ?? "6"
  const cronExpression = `0 ${cronHour} * * ${cronDay}`

  return (
    <div className="space-y-12">
      {SETTINGS_GROUPS.map((group) => {
        const keys = Object.entries(SETTINGS_DEFINITION).filter(
          ([, def]) => def.group === group.id
        )
        if (keys.length === 0) return null

        return (
          <section key={group.id}>
            <div className="mb-6 border-b border-border/60 pb-3">
              <h2 className="text-[15px] font-semibold">{group.label}</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="space-y-6">
              {keys.map(([key, def]) => (
                <SettingField
                  key={key}
                  settingKey={key}
                  label={def.label}
                  description={def.description}
                  type={def.type}
                  value={form[key] ?? def.default}
                  onChange={(v) => update(key, v)}
                  error={errors[key]}
                />
              ))}
            </div>

            {/* Cron expression generated from day + hour */}
            {group.id === "schedule" && (
              <div className="mt-6 rounded-xl bg-muted/40 p-4">
                <p className="text-[12px] font-medium text-muted-foreground">
                  Generated cron expression
                </p>
                <code className="mt-1.5 block font-mono text-[14px] font-semibold tabular-nums">
                  {cronExpression}
                </code>
                <p className="mt-2 text-[11px] text-muted-foreground/70">
                  Update your cron job (Vercel, Coolify, crontab…) with this
                  expression when you change the launch day or hour.
                </p>
              </div>
            )}
          </section>
        )
      })}

      {/* Save */}
      <div className="flex items-center gap-3 border-t border-border/60 pt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Save settings
        </button>
        {isDirty && (
          <span className="text-[11px] text-muted-foreground/70">
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  )
}

// ── Field renderers ────────────────────────────────────────────────────────

function SettingField({
  settingKey,
  label,
  description,
  type,
  value,
  onChange,
  error,
}: {
  settingKey: string
  label: string
  description: string
  type: "string" | "number"
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const inputClass =
    "w-full rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors placeholder:text-muted-foreground/50 focus:bg-muted"
  const selectClass =
    "rounded-xl bg-muted/50 px-4 py-2.5 text-[14px] outline-none transition-colors focus:bg-muted"

  // ── Select: launch day ─────────────────────────────────────
  if (settingKey === "launch_day") {
    return (
      <FieldRow label={label} description={description}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(selectClass, "w-40")}
        >
          {LAUNCH_DAYS.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </FieldRow>
    )
  }

  // ── Select: fonts ──────────────────────────────────────────
  if (settingKey === "font_sans") {
    return (
      <FieldRow label={label} description={description}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(selectClass, "w-52")}
        >
          {FONT_OPTIONS_SANS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </FieldRow>
    )
  }

  if (settingKey === "font_serif") {
    return (
      <FieldRow label={label} description={description}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(selectClass, "w-52")}
        >
          {FONT_OPTIONS_SERIF.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </FieldRow>
    )
  }

  // ── Number fields (with optional unit conversion adornments) ─
  if (type === "number") {
    const conv = UNIT_CONVERSIONS[settingKey]
    return (
      <FieldRow label={label} description={description} error={error}>
        <div className="flex items-center gap-1.5">
          {conv?.prefix && (
            <span className="text-[13px] text-muted-foreground">
              {conv.prefix}
            </span>
          )}
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              inputClass,
              "w-24 text-right tabular-nums",
              error && "ring-2 ring-destructive/30",
            )}
          />
          {conv?.suffix && (
            <span className="text-[13px] text-muted-foreground">
              {conv.suffix}
            </span>
          )}
        </div>
      </FieldRow>
    )
  }

  // ── String fields (full width) ─────────────────────────────
  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium">{label}</label>
      <p className="mb-2 text-[11px] text-muted-foreground">{description}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, error && "ring-2 ring-destructive/30")}
      />
      {error && (
        <p className="mt-1.5 text-[11px] text-destructive">{error}</p>
      )}
    </div>
  )
}

function FieldRow({
  label,
  description,
  error,
  children,
}: {
  label: string
  description: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {description}
        </p>
        {error && (
          <p className="mt-1 text-[11px] text-destructive">{error}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
