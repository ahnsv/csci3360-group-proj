'use client'

import { Course } from "@/app/_api/courses"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"
import { Calendar, GraduationCap, User } from "lucide-react"

interface CourseListProps {
  courses: Course[]
}

export default function CourseList({ courses }: CourseListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCourseId = searchParams.get('courseId')

  const handleCourseSelect = (courseId: number) => {
    router.push(`/coursework?courseId=${courseId}`)
  }

  return (
    <div className="flex flex-col">
      {courses.map((course) => (
        <button
          key={course.id}
          onClick={() => handleCourseSelect(course.id)}
          className={cn(
            "flex flex-col gap-1 p-4 text-left hover:bg-accent transition-colors",
            selectedCourseId === course.id?.toString() && "bg-muted"
          )}
        >
          <div className="font-medium">{course.name}</div>
          {course.instructor && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              {course.instructor}
            </div>
          )}
          {course.days && course.time && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {course.days} {course.time}
            </div>
          )}
        </button>
      ))}
    </div>
  )
} 