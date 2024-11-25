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
import { ScrollArea } from "@/components/ui/scroll-area"

interface SubTask {
  title: string
  estimatedTime: number
  scheduled: boolean
}

interface TimeSlot {
  start: string
  end: string
  isAvailable: boolean
}

type TaskEstimationFormProps = {
    taskName: string
    courseName: string
    closeForm: () => void
}

async function getEventsOnDay(date: Date, accessToken: string) {
  const response = await fetch(`${API_URL}/auth/google/events/?date=${date.toISOString().split('T')[0]}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch events')
  }
  const data = await response.json()
  return data
}

interface ScheduleRecommendation {
  subtask: SubTask
  recommendedSlot: TimeSlot | null
}

export default function TaskEstimationForm({ taskName, courseName, closeForm }: TaskEstimationFormProps) {
  const [step, setStep] = useState<'estimation' | 'planning'>('estimation')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [customSubTasks, setCustomSubTasks] = useState<SubTask[]>([])
  const { toast } = useToast()
  const { accessToken } = useAuth()

  const [recommendedSubTasks, setRecommendedSubTasks] = useState<SubTask[]>([])
  const [selectedRecommendedSubTasks, setSelectedRecommendedSubTasks] = useState<SubTask[]>([])
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
          isSelected: false,
          scheduled: false
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

  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [scheduleRecommendations, setScheduleRecommendations] = useState<ScheduleRecommendation[]>([])
  const [currentSubtask, setCurrentSubtask] = useState<SubTask | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await getEventsOnDay(selectedDate, accessToken)
      
      // Create 30-minute time slots between 9am-5pm
      const timeSlots: TimeSlot[] = []
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startHour = `${hour}`.padStart(2, '0')
          const startMinute = `${minute}`.padStart(2, '0')
          const endHour = minute === 30 ? `${hour}`.padStart(2, '0') : `${hour + 1}`.padStart(2, '0')
          const endMinute = minute === 30 ? '00' : '30'
          
          const startTime = `${startHour}:${startMinute}`
          const endTime = `${endHour}:${endMinute}`
          
          const hasConflict = events.items.some((event: any) => {
            const eventStart = new Date(event.start.dateTime)
            const eventEnd = new Date(event.end.dateTime)
            const slotStart = new Date(selectedDate)
            const slotEnd = new Date(selectedDate)
            
            slotStart.setHours(hour, minute, 0)
            slotEnd.setHours(minute === 30 ? hour : hour + 1, minute === 30 ? 0 : 30, 0)
            
            return eventStart < slotEnd && eventEnd > slotStart
          })

          timeSlots.push({
            start: startTime,
            end: endTime,
            isAvailable: !hasConflict
          })
        }
      }
      
      setAvailableTimeSlots(timeSlots)
    }

    fetchEvents()
  }, [selectedDate, accessToken])

  useEffect(() => {
    setCurrentSubtask(getNextUnscheduledSubtask())
  }, [selectedRecommendedSubTasks, customSubTasks])

  const getNextUnscheduledSubtask = () => {
    const allTasks = [...selectedRecommendedSubTasks, ...customSubTasks]
    return allTasks.find(task => !task.scheduled) || null
  }

  const getValidTimeSlots = () => {
    if (!currentSubtask) return []
    
    const taskDurationMinutes = currentSubtask.estimatedTime
    const validSlots: TimeSlot[] = []

    // Convert time string to minutes since 9 AM
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return (hours - 9) * 60 + minutes
    }

    // Convert minutes since 9 AM to time string
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60) + 9
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    // Find consecutive available slots that match task duration
    for (let i = 0; i < availableTimeSlots.length; i++) {
      const startSlot = availableTimeSlots[i]
      const startMinutes = timeToMinutes(startSlot.start)
      const endMinutes = startMinutes + taskDurationMinutes
      
      // Check if the end time would go beyond 5 PM (480 = minutes from 9 AM to 5 PM)
      if (endMinutes > 480) break

      let hasConflict = false
      const slotsNeeded = Math.ceil(taskDurationMinutes / 30)

      // Check if all required slots are available
      for (let j = 0; j < slotsNeeded; j++) {
        if (!availableTimeSlots[i + j]?.isAvailable) {
          hasConflict = true
          break
        }
      }

      if (!hasConflict) {
        validSlots.push({
          start: startSlot.start,
          end: minutesToTime(endMinutes),
          isAvailable: true
        })
      }
    }

    return validSlots
  }

  const handleRecommendedSubTaskToggle = (index: number) => {
    setSelectedRecommendedSubTasks(prev => {
      if (prev.includes(recommendedSubTasks[index])) {
        return prev.filter(task => task !== recommendedSubTasks[index])
      }
      return [...prev, recommendedSubTasks[index]]
    })
  }

  const getTotalEstimatedTime = () => {
    return selectedRecommendedSubTasks
      .reduce((total, task) => total + task.estimatedTime, 0)
  }

  const handleSubmit = () => {
    toast({
      title: "Success!",
      description: "Your plan has been added to your calendar.",
      duration: 3000,
    })
    closeForm()
  }

  const generateRecommendations = (timeSlots: TimeSlot[]) => {
    const allTasks = [...selectedRecommendedSubTasks, ...customSubTasks]
    let currentSlotIndex = 0
    
    const recommendations: ScheduleRecommendation[] = allTasks.map(task => {
      // Find next available time slot that can fit the task
      while (currentSlotIndex < timeSlots.length) {
        if (timeSlots[currentSlotIndex].isAvailable) {
          const recommendation: ScheduleRecommendation = {
            subtask: task,
            recommendedSlot: timeSlots[currentSlotIndex]
          }
          currentSlotIndex++
          return recommendation
        }
        currentSlotIndex++
      }
      
      return {
        subtask: task,
        recommendedSlot: null
      }
    })
    
    setScheduleRecommendations(recommendations)
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
                      checked={selectedRecommendedSubTasks.includes(task)}
                      onCheckedChange={() => handleRecommendedSubTaskToggle(index)}
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
                    onClick={() => setCustomSubTasks([...customSubTasks, { title: '', estimatedTime: 0, scheduled: false }])}
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
                        scheduled: false
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
                    checked={selectedRecommendedSubTasks.includes(subtask)}
                    onCheckedChange={() => {
                      const newSubTasks = [...customSubTasks];
                      newSubTasks[index].scheduled = !subtask.scheduled;
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
                {currentSubtask ? (
                  <>
                    <div className="p-4 border rounded-md bg-blue-50">
                      <h3 className="text-lg font-medium">Current Task</h3>
                      <p className="text-sm">{currentSubtask.title}</p>
                      <p className="text-sm text-gray-600">Duration: {currentSubtask.estimatedTime} minutes</p>
                    </div>
                    <h3 className="text-lg font-medium">Available Time Slots</h3>
                    <ScrollArea className="h-64"> 
                      {getValidTimeSlots().map((slot, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start mb-2"
                          onClick={() => {
                            if (currentSubtask) {
                              // Update the subtask as scheduled
                              if (selectedRecommendedSubTasks.includes(currentSubtask)) {
                                setSelectedRecommendedSubTasks(prev =>
                                  prev.map(task =>
                                    task === currentSubtask ? { ...task, scheduled: true } : task
                                  )
                                )
                              } else {
                                setCustomSubTasks(prev =>
                                  prev.map(task =>
                                    task === currentSubtask ? { ...task, scheduled: true } : task
                                  )
                                )
                              }
                              // Set next unscheduled subtask
                              setCurrentSubtask(getNextUnscheduledSubtask())
                            }
                          }}
                        >
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {slot.start} - {slot.end}
                        </Button>
                      ))}
                    </ScrollArea>
                  </>
                ) : (
                  <div className="p-4 border rounded-md bg-green-50">
                    <h3 className="text-lg font-medium">All Tasks Scheduled!</h3>
                    <p className="text-sm">You can now add these to your calendar.</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-medium">Tasks to Schedule</h3>
                <div className="space-y-2">
                  {[...selectedRecommendedSubTasks, ...customSubTasks].map((subtask, index) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-2 p-2 rounded ${
                        subtask.scheduled ? 'bg-gray-50 text-gray-400' : 
                        subtask === currentSubtask ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="flex-1 text-sm">{subtask.title}</span>
                      <span className="text-sm text-gray-500">
                        ({subtask.estimatedTime} min)
                      </span>
                    </div>
                  ))}
                </div>
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
