'use client';

import { Course } from '@/app/_api/courses';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertCircle, Archive, BookOpen, Calendar, Clock, FileText, ImageIcon, Music, User, Video } from 'lucide-react';
import Image from 'next/image';
import { AssignmentOrQuiz } from '../dashboard/main-widgets';

export interface Material {
  id: number
  name: string
  type: 'pdf' | 'video' | 'image' | 'doc' | 'ppt' | 'xls' | 'img' | 'audio' | 'zip' | 'other'
  url: string
//   thumbnail: string
//   description: string
}

interface CourseCardProps {
    courseInfo: Course;
    assignmentsOrQuizzes: AssignmentOrQuiz;
    materials: Material[];
}

export default function Component({ courseInfo, assignmentsOrQuizzes, materials }: CourseCardProps) {

    const assignments = assignmentsOrQuizzes?.assignments || [];
    const quizzes = assignmentsOrQuizzes?.quizzes || [];

  const handleAssignmentClick = (assignment: AssignmentOrQuiz['assignments'][0]) => {
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
        <CardTitle className="text-2xl font-bold">{courseInfo.name}</CardTitle>
        <div className="flex items-center mt-2">
          <User className="mr-2" size={18} />
          <span>{courseInfo.instructor}</span>
        </div>
        <div className="flex items-center mt-1">
          <Calendar className="mr-2" size={18} />
          <span>{courseInfo.days || 'TBD'}</span>
          <Clock className="ml-4 mr-2" size={18} />
          <span>{courseInfo.time || 'TBD'}</span>
        </div>
      </CardHeader>
      <CardContent className="mt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <BookOpen className="mr-2" size={20} />
          Upcoming Assignments & Quizzes
        </h3>
        <ul className="space-y-2 mb-4">
          {assignments.map((assignment) => (
            <li key={assignment.title}>
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
                    <p className="text-sm">Due: {assignment.due_at}</p>
                    <p className="text-sm text-muted-foreground">{assignment.html_url}</p>
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
          {Array.isArray(materials) && materials.map((material) => (
            <li key={material.id} className="relative group">
              <div className="aspect-w-3 aspect-h-4">
                  {material.type === 'pdf' && <FileText className="w-8 h-8 text-red-500" />}
                  {material.type === 'doc' && <FileText className="w-8 h-8 text-blue-500" />}
                  {material.type === 'ppt' && <FileText className="w-8 h-8 text-orange-500" />}
                  {material.type === 'xls' && <FileText className="w-8 h-8 text-green-500" />}
                  {/* {material.type === 'img' && <Image className="w-8 h-8 text-purple-500" />} */}
                  {material.type === 'video' && <Video className="w-8 h-8 text-pink-500" />}
                  {material.type === 'audio' && <Music className="w-8 h-8 text-indigo-500" />}
                  {material.type === 'zip' && <Archive className="w-8 h-8 text-gray-500" />}
                  {/* {material.type === 'other' && <File className="w-8 h-8 text-gray-400" />} */}
              </div>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" className="w-full h-full absolute inset-0 p-0">
                    <span className="sr-only">{material.name}</span>
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{material.name}</h4>
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