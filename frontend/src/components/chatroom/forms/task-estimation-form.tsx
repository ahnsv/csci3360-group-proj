import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { Clock, CalendarDays, Plus, X } from "lucide-react"
import { API_URL } from "@/app/_api/constants"
import { useAuth } from "@/contexts/AuthContext"

interface SubTask {
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
    courseName: string
}

export default function TaskEstimationForm({ taskName, courseName }: TaskEstimationFormProps) {
  const [step, setStep] = useState<'estimation' | 'planning'>('estimation')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [customSubTasks, setCustomSubTasks] = useState<SubTask[]>([])
  const { toast } = useToast()
  const { accessToken } = useAuth()

  const [recommendedSubTasks, setRecommendedSubTasks] = useState<SubTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    const fetchSubTasks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/subtask/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            task_name: taskName,
            course_name: courseName,
          })
        })
        if (!response.ok) {
          throw new Error('Failed to fetch subtasks')
        }
        const data = await response.json()
        setRecommendedSubTasks(data.map((task: any) => ({
          ...task,
          estimatedTime: task.estimated_time,
          isSelected: false
        })))
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching subtasks:', error)
        setRecommendedSubTasks([])
        setIsLoading(false)
      }
    }

    fetchSubTasks()
  }, [taskName, courseName])

  // Mock timeSlots - would be dynamic based on calendar data
  const timeSlots: TimeSlot[] = [
    { start: "9:00", end: "10:00", isAvailable: true },
    { start: "10:00", end: "11:00", isAvailable: false },
    { start: "11:00", end: "12:00", isAvailable: true },
    { start: "13:00", end: "14:00", isAvailable: true },
    { start: "14:00", end: "15:00", isAvailable: false },
  ]

  const handleSubTaskToggle = (index: number) => {
    setRecommendedSubTasks(recommendedSubTasks.map((task, idx) => 
      idx === index ? { ...task, isSelected: !task.isSelected } : task
    ))
  }

  const getTotalEstimatedTime = () => {
    return recommendedSubTasks
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
        <CardDescription>{courseName}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'estimation' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recommended Subtasks</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                recommendedSubTasks.map((task, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Checkbox
                      checked={task.isSelected}
                      onCheckedChange={() => handleSubTaskToggle(index)}
                    />
                    <Label>{task.title}</Label>
                    <span className="text-sm text-gray-500">
                      ({task.estimatedTime} minutes)
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Subtasks</Label>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setCustomSubTasks([...customSubTasks, { title: '', estimatedTime: 0, isSelected: true }])}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Input
                  placeholder="Type subtask title and press Enter"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      setCustomSubTasks([...customSubTasks, { 
                        title: e.currentTarget.value.trim(), 
                        estimatedTime: 0, 
                        isSelected: true 
                      }]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Input
                  type="number"
                  placeholder="Minutes"
                  className="w-24"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const minutes = parseInt(e.currentTarget.value);
                      if (minutes > 0 && customSubTasks.length > 0) {
                        const newSubTasks = [...customSubTasks];
                        newSubTasks[newSubTasks.length - 1].estimatedTime = minutes;
                        setCustomSubTasks(newSubTasks);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              {customSubTasks.map((subtask, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    checked={subtask.isSelected}
                    onCheckedChange={() => {
                      const newSubTasks = [...customSubTasks];
                      newSubTasks[index].isSelected = !subtask.isSelected;
                      setCustomSubTasks(newSubTasks);
                    }}
                  />
                  <span className="flex-1">{subtask.title}</span>
                  <span className="text-sm text-gray-500 w-24 text-center">
                    {subtask.estimatedTime} min
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const newSubTasks = [...customSubTasks];
                    newSubTasks.splice(index, 1);
                    setCustomSubTasks(newSubTasks);
                  }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
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
