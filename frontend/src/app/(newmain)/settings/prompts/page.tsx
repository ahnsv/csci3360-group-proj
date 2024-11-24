import { Separator } from "@/components/ui/separator";
import PromptForm from "./prompt-forms";

export default function SettingsPromptsPage() {
    return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Prompts</h3>
        <p className="text-sm text-muted-foreground">
            Configure the prompts for task extraction and scheduling.
        </p>
      </div>
      <Separator />
      <PromptForm />
    </div>
    )
}