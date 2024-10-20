import { useGoogleAuth } from "@/hooks/useGoogleAuth"
import { Button } from "@/components/ui/button"
import { Calendar, Check } from "lucide-react"

export function GoogleCalendarSettings() {
  const { isConnected, isLoading, error, connectGoogleCalendar } = useGoogleAuth('/settings')

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div>
      <h2>Google Calendar Settings</h2>
      {isConnected ? (
        <div>
          <Check className="text-green-500" /> Connected to Google Calendar
        </div>
      ) : (
        <Button onClick={connectGoogleCalendar}>
          <Calendar className="mr-2 h-4 w-4" /> Connect Google Calendar
        </Button>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
