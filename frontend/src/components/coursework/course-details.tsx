'use client'

import { Course } from "@/app/_api/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Calendar, FileText, GraduationCap, Link as LinkIcon, User } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ScrollArea } from "../ui/scroll-area"

export default function CourseDetails() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourseDetails() {
      if (!courseId) return

      setLoading(true)
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase
        .from('course')
        .select(`
          *,
          course_material (*)
        `)
        .eq('id', courseId)
        .single()

      if (error) {
        console.error('Error fetching course:', error)
      } else {
        setCourse(data as unknown as Course)
      }
      setLoading(false)
    }

    fetchCourseDetails()
  }, [courseId])

  if (!courseId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a course to view details
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading course details...
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Course not found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.instructor && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{course.instructor}</span>
            </div>
          )}
          {course.days && course.time && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{course.days} {course.time}</span>
            </div>
          )}
          {course.code && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>Course Code: {course.code}</span>
            </div>
          )}
          {course.link && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={course.link} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-500 hover:underline">
                Canvas Course Page
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {course.materials && course.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {course.materials.map((material) => (
                  <div key={material.id} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={material.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {material.name}
                    </a>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 