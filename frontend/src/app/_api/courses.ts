import { Material } from "@/components/ui/course-card";
import { useApiCall } from "./auth";

export type Course = {
    id: number;
    created_at: string;
    updated_at: string;
    name: string;
    description?: string;
    link?: string;
    instructor?: string;
    code?: string;
    canvas_id?: number;
    days?: string;
    time?: string;
    course_material?: Material[];
}


export const useGetCourses = () => useApiCall<Course[]>('/courses/');