import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  description?: string;
}

interface CalendarEventCardProps {
  event: CalendarEvent;
}

export default function CalendarEventCard({ event }: CalendarEventCardProps) {
  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardTitle className="text-2xl font-bold">Event Added to Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-700">{event.title}</h3>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{format(new Date(event.start), 'PPP')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {format(new Date(event.start), 'p')} - {format(new Date(event.end), 'p')}
            </span>
          </div>
          
          {event.description && (
            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 