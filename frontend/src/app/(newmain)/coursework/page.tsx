import { ScrollArea } from "@/components/ui/scroll-area"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Course } from "@/app/_api/courses"
import SyncButton from "@/components/ui/sync-button"
import CourseList from "@/components/coursework/course-list"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import CourseDetails from "@/components/coursework/course-details"
import { AuthProvider } from "@/contexts/AuthContext"
import { API_URL } from "@/app/_api/constants"

async function getCourseList(accessToken: string) {
    const response = await fetch(`${API_URL}/courses/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        console.error('Error fetching courses:', response.statusText)
        return []
    }

    const courses = await response.json()
    return courses as Course[]
}

export default async function CourseworkPage() {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError)
        redirect('/signin')
    }

    const courses = await getCourseList(session.access_token)

    return (
        <AuthProvider accessToken={session.access_token} user={session.user}>
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
        </AuthProvider>
    )
} 