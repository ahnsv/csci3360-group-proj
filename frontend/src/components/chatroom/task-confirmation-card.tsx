import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { API_URL } from "@/app/_api/constants";
import { useState } from "react";

interface Task {
  title: string;
  description?: string;
  due_date: string;
  estimated_time?: number;
  course_name?: string;
}

interface TaskConfirmationCardProps {
  task: Task;
  messageId: number;
}

export default function TaskConfirmationCard({ task, messageId }: TaskConfirmationCardProps) {
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

  const handleConfirmation = async (confirmed: boolean) => {
    try {
      const response = await fetch(`${API_URL}/tasks/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          confirmed,
          task
        }),
      });

      if (!response.ok) throw new Error('Failed to confirm task');
      
      setIsConfirmed(confirmed);
    } catch (error) {
      console.error('Error confirming task:', error);
    }
  };

  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardTitle className="text-2xl font-bold">Confirm New Task</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-orange-700">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600">{task.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {format(new Date(task.due_date), 'PPP')}</span>
          </div>
          
          {task.estimated_time && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Estimated time: {task.estimated_time} minutes</span>
            </div>
          )}

          {task.course_name && (
            <div className="text-sm text-gray-600">
              Course: {task.course_name}
            </div>
          )}
        </div>

        {isConfirmed === null && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => handleConfirmation(false)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleConfirmation(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        )}

        {isConfirmed !== null && (
          <div className="text-center text-sm text-gray-600 italic">
            Task {isConfirmed ? 'confirmed' : 'declined'}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 