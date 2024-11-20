import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { Clock, CalendarDays } from "lucide-react"

interface SubTask {
  id: string
  title: string
  estimatedTime: number
  isSelected: boolean
}

interface TimeSlot {
  start: string
  end: string
  isAvailable: boolean
}

type TaskEstimationFormProps = {
    taskName: string
    taskContext?: string
}

export default function TaskEstimationForm({ taskName, taskContext }: TaskEstimationFormProps) {
  const [step, setStep] = useState<'estimation' | 'planning'>('estimation')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [customEstimation, setCustomEstimation] = useState("")
  const { toast } = useToast()

  // Mock data - in real app would come from API/context
  const recommendedSubTasks: SubTask[] = [
    { id: "1", title: "Research", estimatedTime: 30, isSelected: false },
    { id: "2", title: "Initial Draft", estimatedTime: 60, isSelected: false },
    { id: "3", title: "Review", estimatedTime: 45, isSelected: false },
  ]

  const [subTasks, setSubTasks] = useState(recommendedSubTasks)
  
  // Mock timeSlots - would be dynamic based on calendar data
  const timeSlots: TimeSlot[] = [
    { start: "9:00", end: "10:00", isAvailable: true },
    { start: "10:00", end: "11:00", isAvailable: false },
    { start: "11:00", end: "12:00", isAvailable: true },
    { start: "13:00", end: "14:00", isAvailable: true },
    { start: "14:00", end: "15:00", isAvailable: false },
  ]

  const handleSubTaskToggle = (id: string) => {
    setSubTasks(subTasks.map(task => 
      task.id === id ? { ...task, isSelected: !task.isSelected } : task
    ))
  }

  const getTotalEstimatedTime = () => {
    return subTasks
      .filter(task => task.isSelected)
      .reduce((total, task) => total + task.estimatedTime, 0)
  }

  const handleSubmit = () => {
    toast({
      title: "Success!",
      description: "Your plan has been added to your calendar.",
      duration: 3000,
    })
  }

  return (
    <Card className="w-full max-w-2xl border-none">
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {step === 'estimation' ? 'Task Estimation' : 'Schedule Planning'}
        </CardTitle>
        <CardTitle>{taskName}</CardTitle>
        <CardDescription>{taskContext}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'estimation' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recommended Subtasks</h3>
              {subTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  <Checkbox
                    checked={task.isSelected}
                    onCheckedChange={() => handleSubTaskToggle(task.id)}
                  />
                  <Label>{task.title}</Label>
                  <span className="text-sm text-gray-500">
                    ({task.estimatedTime} minutes)
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Custom Estimation (minutes)</Label>
              <Input
                type="number"
                value={customEstimation}
                onChange={(e) => setCustomEstimation(e.target.value)}
                placeholder="Enter custom time estimation"
              />
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Total Estimated Time: {getTotalEstimatedTime()} minutes</span>
            </div>

            <Button onClick={() => setStep('planning')}>
              Continue to Planning
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium">Available Time Slots</h3>
                {timeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.isAvailable ? "outline" : "ghost"}
                    disabled={!slot.isAvailable}
                    className="w-full justify-start"
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {slot.start} - {slot.end}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('estimation')}>
                Back to Estimation
              </Button>
              <Button onClick={handleSubmit}>
                Add to Calendar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
