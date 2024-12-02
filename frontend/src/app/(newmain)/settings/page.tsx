import { Separator } from "@/components/ui/separator"
import { PreferencesForm } from "@/components/ui/profile-form"

export default function SettingsPreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferences</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <PreferencesForm />
    </div>
  )
}