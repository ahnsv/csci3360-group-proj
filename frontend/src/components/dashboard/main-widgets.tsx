import { createServerSupabaseClient } from "@/lib/supabase/server";
import CourseCard, { Material } from "../ui/course-card"
import { redirect } from "next/navigation";
import { API_URL } from "@/app/_api/constants";
import { Course } from "@/app/_api/courses";
import { ScrollBar } from "../ui/scroll-area";
import { ScrollArea } from "../ui/scroll-area";
import TaskChart from "../ui/task-chart";
import TaskStackedBarChart from "../ui/task-stacked-bar-chart";
import { FileText } from "lucide-react";

const getCourseInfo: (accessToken: string) => Promise<Course[]> = async (accessToken: string) => {
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
    });
    return response.json();
}

export default async function MainWidgets() {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        console.error('Error fetching user:', userError);
        redirect('/signin')
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError);
        redirect('/signin')
    }

    const courses: (Course & { materials?: Material[] })[] = await getCourseInfo(session.access_token);
    const courseInfos: Record<number, Course> = {};
    const courseAssignmentsOrQuizzes: Record<number, AssignmentOrQuiz> = {};

    for (const course of courses) {
        const courseInfo = await getCourse(session.access_token, course.id);
        courseInfos[course.id] = courseInfo;
        const assignmentsOrQuizzes = await getAssignmentsOrQuizzes(session.access_token, course.id);
        courseAssignmentsOrQuizzes[course.id] = assignmentsOrQuizzes;
    }
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="main-widget-cols grid grid-cols-4 gap-4">
                <div className="main-widget-charts grid grid-cols-2 gap-4 col-span-2">
                    <TaskStackedBarChart />
                    <TaskChart />
                </div>
                <div className="main-widget-courses col-span-2">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Courses
                    </h3>
                    <ScrollArea className="w-full whitespace-nowrap my-2">
                        <div className="flex space-x-4 pb-4">
                        {courses.map((course) => (
                            <div key={course.id} className="flex-none w-[400px]">
                                <CourseCard courseInfo={courseInfos[course.id]} assignmentsOrQuizzes={courseAssignmentsOrQuizzes[course.id]} materials={courseInfos[course.id].materials || []} />
                            </div>
                            ))}
                            </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}

