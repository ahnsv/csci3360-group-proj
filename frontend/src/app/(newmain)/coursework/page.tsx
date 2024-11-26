import { ScrollArea } from "@/components/ui/scroll-area"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Course } from "@/app/_api/courses"
import SyncButton from "@/components/ui/sync-button"
import CourseList from "@/components/coursework/course-list"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import CourseDetails from "@/components/coursework/course-details"

async function getCourseList(supabase: ReturnType<typeof createServerSupabaseClient>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return []
    }
    const { data: courses, error } = await supabase
        .from('course_membership')
        .select(`
            course (
                id,
                name,
                code,
                instructor,
                link,
                description,
                hidden,
                created_at,
                updated_at,
                canvas_id,
                course_material (*)
            )
        `)
        .eq('user_id', user?.id ?? '')

    if (error) {
        console.error('Error fetching courses:', error)
        return []
    }

    return courses.map(c => ({ ...c.course, materials: c.course?.course_material ?? [] })) as unknown as Course[]
}

export default async function CourseworkPage() {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError)
        redirect('/signin')
    }

    const courses = await getCourseList(supabase)

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={25} minSize={20}>
                    <div className="flex h-full flex-col text-sm">
                        <div className="flex items-center justify-between p-4">
                            <h1 className="text-lg font-semibold">My Courses</h1>
                            <SyncButton accessToken={session.access_token} />
                        </div>
                        <ScrollArea className="flex-1">
                            <CourseList courses={courses} />
                        </ScrollArea>
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={75}>
                    <div className="flex h-full flex-col">
                        <div className="p-4">
                            <h2 className="text-lg font-semibold">Course Details</h2>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <CourseDetails />
                        </ScrollArea>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
} 