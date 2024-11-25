import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Book, ExternalLink, Clock } from 'lucide-react'
import { format } from "date-fns"
import { Button } from "../ui/button"
import TaskEstimationForm from "./forms/task-estimation-form"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
import { useState } from "react"

export interface Assignment {
  title: string
  due_at: string
  course_name: string
  course_id: number
  html_url: string
}

export interface Quiz {
  id: number
  title: string
  html_url: string
}

interface AssignmentDisplayProps {
  assignments?: Assignment[]
  quizzes?: Quiz[] // Assuming quizzes might be added later
}

export default function Component({ assignments = [], quizzes = [] }: AssignmentDisplayProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardTitle className="text-2xl font-bold">Upcoming Assignments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {assignments.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No upcoming assignments at the moment.
          </div>
        )}
        {assignments.map((assignment, index) => (
          <div
            key={assignment.course_id + assignment.title}
            className={`p-4 ${
              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            } hover:bg-gray-100 transition-colors duration-200`}
          >
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-blue-700">{assignment.course_name}</h3>
              <h4 className="text-md font-medium text-gray-700">{assignment.title}</h4>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="italic">Due: {format(new Date(assignment.due_at), 'PPP p')}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Clock className="w-4 h-4 mr-2" />
              <span>Time remaining: {getRemainingTime(assignment.due_at)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Book className="w-4 h-4 mr-2" />
              <span>Course ID: {assignment.course_id}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge variant="secondary" className="text-xs">
                Assignment ID: {getAssignmentId(assignment.html_url)}
              </Badge>
              <div className="flex items-center space-x-2">
                <a
                href={assignment.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                View Assignment
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Estimate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <TaskEstimationForm taskName={assignment.title} courseName={assignment.course_name} closeForm={() => setIsFormOpen(false)} />
                </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function getRemainingTime(dueDate: string): string {
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = Math.abs(due.getTime() - now.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (due < now) {
    return "Past due"
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    return "Less than an hour"
  }
}

function getAssignmentId(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1]
}