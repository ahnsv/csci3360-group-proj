import { createServerSupabaseClient } from "@/lib/supabase/server";
import CourseCard, { Material } from "../ui/course-card"
import { redirect } from "next/navigation";
import { API_URL } from "@/app/_api/constants";
import { Course } from "@/app/_api/courses";
import { ScrollBar } from "../ui/scroll-area";
import { ScrollArea } from "../ui/scroll-area";

const getCourseInfo: (accessToken: string) => Promise<Course[]> = async (accessToken: string) => {
    const response = await fetch(`${API_URL}/courses`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    });
    return response.json();
}
const getMaterials: (accessToken: string, courseId: number) => Promise<Material[]> = async (accessToken: string, courseId: number) => {
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

const getAssignmentsOrQuizzes: (accessToken: string, courseId: number) => Promise<AssignmentOrQuiz> = async (accessToken: string, courseId: number) => {
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

    const courses: (Course & {materials?: Material[]})[] = await getCourseInfo(session.access_token);
    const courseMaterials: Record<number, Material[]> = {};
    const courseAssignmentsOrQuizzes: Record<number, AssignmentOrQuiz> = {};

    for (const course of courses) {
        const materials = await getMaterials(session.access_token, course.id);
        courseMaterials[course.id] = materials;
        const assignmentsOrQuizzes = await getAssignmentsOrQuizzes(session.access_token, course.id);
        courseAssignmentsOrQuizzes[course.id] = assignmentsOrQuizzes;
    }
  return (
    <div className="w-full max-w-7xl mx-auto">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 pb-4">
          {courses.map((course) => (
            <div key={course.id} className="flex-none w-[400px]">
              <CourseCard courseInfo={course} assignmentsOrQuizzes={courseAssignmentsOrQuizzes[course.id]} materials={courseMaterials[course.id] || []} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

