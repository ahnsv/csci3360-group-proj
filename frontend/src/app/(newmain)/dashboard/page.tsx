import TaskStackedBarChart from "@/components/ui/task-stacked-bar-chart";
import TaskChart from "@/components/ui/task-chart";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-4">
        <div className="grid grid-cols-2 gap-2 col-span-2">
            <div className="flex flex-col items-center justify-center p-6 rounded-xl border hover:bg-slate-50 cursor-pointer">
                <span className="text-3xl font-bold">45m</span>
                <span className="text-sm text-muted-foreground">Avg. Task Time</span>
                <span className="text-xs text-blue-600 mt-1">Plan your schedule better</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-xl border hover:bg-slate-50 cursor-pointer">
                <span className="text-3xl font-bold text-green-600">2.5h</span>
                <span className="text-sm text-muted-foreground">Time Saved Today</span>
                <span className="text-xs text-green-600 mt-1">View productivity stats</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-xl border hover:bg-slate-50 cursor-pointer">
                <span className="text-3xl font-bold text-yellow-600">3h</span>
                <span className="text-sm text-muted-foreground">Est. Work Left</span>
                <span className="text-xs text-yellow-600 mt-1">Click to prioritize</span>
            </div>
            <div className="flex flex-col items-center justify-center p-6 rounded-xl border hover:bg-slate-50 cursor-pointer">
                <span className="text-3xl font-bold text-red-600">30m</span>
                <span className="text-sm text-muted-foreground">Urgent Task Time</span>
                <span className="text-xs text-red-600 mt-1">Start now to finish on time</span>
            </div>
        </div>
        <TaskStackedBarChart />
        <TaskChart />
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
