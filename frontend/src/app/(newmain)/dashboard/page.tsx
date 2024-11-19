import TaskStackedBarChart from "@/components/ui/task-stacked-bar-chart";
import TaskChart from "@/components/ui/task-chart";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <TaskStackedBarChart />
        <TaskChart />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" >
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Courses
                    </h3>
                    <ScrollArea className="w-full whitespace-nowrap my-2">
                        <div className="flex space-x-4 pb-4">
                        {/* {courses.map((course) => (
                            <div key={course.id} className="flex-none w-[400px]">
                                <CourseCard courseInfo={courseInfos[course.id]} assignmentsOrQuizzes={courseAssignmentsOrQuizzes[course.id]} materials={courseInfos[course.id].materials || []} />
                            </div>
                            ))} */}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
    </div>
  )
}
