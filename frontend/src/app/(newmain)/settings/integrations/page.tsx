import { Separator } from "@/components/ui/separator"
import IntegrationForm from "./integration-form"

export default function SettingsIntegrationsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Integrations</h3>
                <p className="text-sm text-muted-foreground">
                    Configure the integrations with external services.
                </p>
            </div>
            <Separator />
            <IntegrationForm />
        </div>
    )
}