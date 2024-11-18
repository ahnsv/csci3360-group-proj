'use client';

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, BookOpen, AlertCircle, FileText, Video, ImageIcon } from 'lucide-react'

interface Assignment {
  id: number
  title: string
  dueDate: string
  description: string
}

interface Material {
  id: number
  title: string
  type: 'pdf' | 'video' | 'image'
  thumbnail: string
  description: string
}

export default function Component() {
  const [assignments] = useState<Assignment[]>([
    { id: 1, title: "Midterm Paper", dueDate: "2023-10-15", description: "5-page essay on quantum mechanics" },
    { id: 2, title: "Problem Set 3", dueDate: "2023-10-22", description: "Exercises covering chapters 7-9" },
    { id: 3, title: "Quiz 2", dueDate: "2023-10-29", description: "30-minute quiz on recent lectures" },
  ])

  const [materials] = useState<Material[]>([
    { id: 1, title: "Lecture Notes Week 1", type: 'pdf', thumbnail: "/placeholder.svg?height=80&width=60", description: "Introduction to Newtonian Mechanics" },
    { id: 2, title: "Lab Demo Video", type: 'video', thumbnail: "/placeholder.svg?height=80&width=60", description: "Demonstration of pendulum experiment" },
    { id: 3, title: "Diagram: Projectile Motion", type: 'image', thumbnail: "/placeholder.svg?height=80&width=60", description: "Visual representation of projectile motion concepts" },
  ])

  const handleAssignmentClick = (assignment: Assignment) => {
    alert(`Navigating to estimation page for: ${assignment.title}`)
  }

  const getIcon = (type: Material['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-blue-500" />
      case 'video':
        return <Video className="h-6 w-6 text-red-500" />
      case 'image':
        return <ImageIcon className="h-6 w-6 text-green-500" />
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">Introduction to Physics</CardTitle>
        <div className="flex items-center mt-2">
          <User className="mr-2" size={18} />
          <span>Dr. Jane Smith</span>
        </div>
        <div className="flex items-center mt-1">
          <Calendar className="mr-2" size={18} />
          <span>MWF</span>
          <Clock className="ml-4 mr-2" size={18} />
          <span>10:00 AM</span>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2" size={20} />
          Upcoming Assignments & Quizzes
        </h3>
        <ul className="space-y-2 mb-4">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    {assignment.title}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{assignment.title}</h4>
                    <p className="text-sm">Due: {assignment.dueDate}</p>
                    <p className="text-sm text-muted-foreground">{assignment.description}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </li>
          ))}
        </ul>
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <FileText className="mr-2" size={20} />
          Course Materials
        </h3>
        <ul className="grid grid-cols-3 gap-2">
          {materials.map((material) => (
            <li key={material.id} className="relative group">
              <div className="aspect-w-3 aspect-h-4">
                <img
                  src={material.thumbnail}
                  alt={material.title}
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {getIcon(material.type)}
                </div>
              </div>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" className="w-full h-full absolute inset-0 p-0">
                    <span className="sr-only">{material.title}</span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{material.title}</h4>
                    <p className="text-sm text-muted-foreground">{material.description}</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}