import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  estimated_time?: number;
  course_name?: string;
  status: 'pending' | 'completed';
  created_at: string;
}

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardTitle className="text-2xl font-bold">Task Added</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-700">{task.title}</h3>
            {task.status === 'completed' && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
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
            <div className="flex items-center text-sm text-gray-600">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Course: {task.course_name}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Added: {format(new Date(task.created_at), 'PPP')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 