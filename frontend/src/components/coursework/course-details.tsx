'use client'

import { Course } from "@/app/_api/courses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Calendar, FileText, GraduationCap, Link as LinkIcon, User } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { Plus, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { UploadDropzone } from "@/components/ui/upload-dropzone"
import { toast } from "@/hooks/use-toast"
import { API_URL } from "@/app/_api/constants"
import { useAuth } from "@/contexts/AuthContext"

export default function CourseDetails() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const { accessToken } = useAuth();
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

  const handleIndex = async () => {
    const response = await fetch(`${API_URL}/jobs/trigger-process-course-materials?course_id=${courseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })
    if (response.status === 200) {
      toast({
        title: "Success",
        description: "Course materials are being processed",
      })
    }
    if (response.status === 404) {
      const data = await response.json()
      if (data.detail === "No course materials found") {
        toast({
          title: "No materials to index",
          description: "Either there are no materials to index or the materials are already being processed",
        })
      }
    }
  }

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Course Materials</CardTitle>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Course Material</DialogTitle>
                </DialogHeader>
                <UploadDropzone courseId={courseId} />
              </DialogContent>
            </Dialog>

            <Button size="sm" variant="outline" onClick={handleIndex}>
              <BookOpen className="h-4 w-4 mr-2" />
              Index Materials
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {course.course_material && course.course_material.length > 0 ? (
                course.course_material.map((material) => (
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
                ))
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No course materials available at this moment
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 