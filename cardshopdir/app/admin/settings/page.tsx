import { getSettings } from "@/lib/settings"
import { SettingsForm } from "./settings-form"

export const metadata = { title: "Settings - Admin" }

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Settings</h1>
      <SettingsForm values={settings} />
    </div>
  )
}
