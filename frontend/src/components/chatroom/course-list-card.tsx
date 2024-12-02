import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { CanvasCourse } from "./chat-area";

interface CourseListCardProps {
  courses: CanvasCourse[];
}

export default function CourseListCard({ courses }: CourseListCardProps) {
  return (
    <Card className="w-full max-w-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardTitle className="text-2xl font-bold">Your Canvas Courses</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {courses.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No courses found.
          </div>
        ) : (
          courses.map((course, index) => (
            <div
              key={course.id}
              className={`p-4 ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              } hover:bg-gray-100 transition-colors duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-700">
                      {course.name}
                    </h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Added: {format(new Date(course.created_at), 'PPP')}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {course.id}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
} 