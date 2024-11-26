'use client';

import { Course } from '@/app/_api/courses';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Archive, BookOpen, Calendar, Clock, FileText, Music, User, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from './separator';
import { API_URL } from '@/app/_api/constants';
import TaskEstimationForm from '../chatroom/forms/task-estimation-form';
import { Dialog, DialogContent } from './dialog';

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
}

const getCourseList: (accessToken: string) => Promise<Course[]> = async (accessToken: string) => {
    const response = await fetch(`${API_URL}/courses`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    });
    return response.json();
}
const getCourse: (accessToken: string, courseId: number) => Promise<Course> = async (accessToken: string, courseId: number) => {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    });
    return response.json();
}
export const getMaterials: (accessToken: string, courseId: number) => Promise<Material[]> = async (accessToken: string, courseId: number) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/materials`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        cache: 'force-cache'
    });
    return response.json();
}

interface Assignment {
    title: string;
    due_at: string;
    course_name: string;
    course_id: number;
    html_url: string;
}

interface Quiz {
    title: string;
    due_at: string;
    course_name: string;
    course_id: number;
    html_url: string;
}


export type AssignmentOrQuiz = {
    assignments: Assignment[];
    quizzes: Quiz[];
}

export const getAssignmentsOrQuizzes: (accessToken: string, courseId: number) => Promise<AssignmentOrQuiz> = async (accessToken: string, courseId: number) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/assignments`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        cache: 'force-cache'
    });
    return response.json();
}


export default function Component({ courseInfo }: CourseCardProps) {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentOrQuiz['assignments']>([]);
  const [quizzes, setQuizzes] = useState<AssignmentOrQuiz['quizzes']>([]);
  const [courseMaterials, setCourseMaterials] = useState<Material[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isEstimationFormOpen, setIsEstimationFormOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const assignmentsOrQuizzes = await getAssignmentsOrQuizzes(accessToken, courseInfo.id);
        const materials = await getMaterials(accessToken, courseInfo.id);
        setAssignments(assignmentsOrQuizzes?.assignments || []);
        setQuizzes(assignmentsOrQuizzes?.quizzes || []);
        setCourseMaterials(materials || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseInfo]);

  const handleAssignmentClick = (assignment: AssignmentOrQuiz['assignments'][0]) => {
    setSelectedAssignment(assignment);
    setIsEstimationFormOpen(true);
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="rounded-t-lg">
          <CardTitle 
            className="text-2xl font-bold text-foreground bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
          >
            {courseInfo.name}
          </CardTitle>
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
        <Separator className="my-2" />
        <CardContent className="mt-4">
          {/* <h3 className="text-sm font-light mb-2 flex items-center">
            <BookOpen className="mr-2" size={15} />
            Upcoming Assignments & Quizzes
          </h3> */}
          {isLoading ? (
            <div className="space-y-2 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
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
                    <HoverCardContent className="w-full">
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
          )}
          {/* <h3 className="text-sm font-light mb-2 flex items-center">
            <FileText className="mr-2" size={15} />
            Course Materials
          </h3> */}
          {isLoading ? (
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-w-3 aspect-h-4 bg-gray-200 animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-6 gap-2">
              {Array.isArray(courseMaterials) && courseMaterials.map((material) => (
                <li key={material.id} className="relative group">
                  <div className="aspect-w-3 aspect-h-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-red-500" />
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isEstimationFormOpen} onOpenChange={setIsEstimationFormOpen}>
        <DialogContent className="max-w-4xl">
          {selectedAssignment && (
            <TaskEstimationForm 
              accessToken={accessToken}
              taskName={selectedAssignment.title}
              courseName={selectedAssignment.course_name}
              closeForm={() => setIsEstimationFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}