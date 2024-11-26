"use client"

import { useCanvasConnect } from "@/app/_api/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGoogleAuth } from "@/hooks/useGoogleAuth"
import { Calendar, Check, Loader2, Sun, Moon, Clock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from '@/lib/utils'

export default function OnboardingSteps({accessToken}: { accessToken: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentStep, setCurrentStep] = useState(0)
    const [canvasApiToken, setCanvasApiToken] = useState("")
    const [chronotype, setChronotype] = useState<'morning' | 'night'>('morning')
    const {isConnected, isLoading, error, connectGoogleCalendar} = useGoogleAuth('/onboard', accessToken)
    const {isLoading: canvasLoading, error: canvasError, execute: canvasConnect} = useCanvasConnect()

    // Track completion status for each step
    const [stepsCompleted, setStepsCompleted] = useState({
        welcome: false,
        calendar: false,
        canvas: false,
        preference: false
    })

    // Initialize step from URL query param
    useEffect(() => {
        const step = searchParams.get('step')
        if (step) {
            const stepNumber = parseInt(step)
            if (stepNumber >= 0 && stepNumber <= 4) {
                setCurrentStep(stepNumber)
            }
        }
    }, [searchParams])

    // Update URL when step changes
    useEffect(() => {
        const url = new URL(window.location.href)
        url.searchParams.set('step', currentStep.toString())
        window.history.replaceState({}, '', url.toString())
    }, [currentStep])

    const steps = [
        {title: "Welcome", description: "Start your onboarding process"},
        {title: "Connect Google Calendar", description: "Sync your schedule"},
        {title: "Connect Canvas API", description: "Access your course information"},
        {title: "Study Preference", description: "Set your study time"},
        {title: "All Set!", description: "You're ready to go"},
    ]

    // Check if current step can proceed
    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return true // Welcome step can always proceed
            case 1:
                return isConnected // Google Calendar must be connected
            case 2:
                return stepsCompleted.canvas // Canvas API must be connected
            case 3:
                return chronotype !== null // Study preference must be selected
            case 4:
                return true // Final step can always proceed
            default:
                return false
        }
    }

    const handleCanvasApiConnect = async () => {
        try {
            const {success, message} = await canvasConnect({
                method: 'POST',
                body: {token: canvasApiToken},
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (success) {
                setStepsCompleted(prev => ({...prev, canvas: true}))
                setCurrentStep(currentStep + 1)
            } else {
                throw new Error(message || 'Failed to connect to Canvas API')
            }
        } catch (error) {
            console.error('Error connecting to Canvas API:', error)
        }
    }

    const handleNext = () => {
        if (canProceed()) {
            if (currentStep === steps.length - 1) {
                router.push('/')
            } else {
                setCurrentStep(prev => prev + 1)
            }
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
                        <p className="mb-4">Let's get you set up with your calendar and course information.</p>
                    </div>
                )
            case 1:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Connect Google Calendar</h2>
                        <p className="mb-4">We'll use this to sync your schedule and events.</p>
                        {isLoading ? (
                            <p>Checking connection status...</p>
                        ) : isConnected ? (
                            <div>
                                <Check className="mx-auto h-8 w-8 text-green-500 mb-2"/>
                                <p className="text-green-600 mb-4">Google Calendar connected successfully!</p>
                            </div>
                        ) : (
                            <>
                                <Button onClick={connectGoogleCalendar}>
                                    <Calendar className="mr-2 h-4 w-4"/> Connect Google Calendar
                                </Button>
                                {error && <p className="text-red-500 mt-2">{error}</p>}
                            </>
                        )}
                    </div>
                )
            case 2:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Connect Canvas API</h2>
                        <Button variant="outline" className="mb-4" onClick={() => {
                            window.open('https://bostoncollege.instructure.com/profile/settings#access_tokens', '_blank')
                        }}>
                            Get Canvas Token
                        </Button>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-full max-w-sm">
                                {/* <Label htmlFor="api-token" className="text-left">Canvas API Token</Label> */}
                                <Input
                                    id="api-token"
                                    type="password"
                                    placeholder="Enter your API token"
                                    value={canvasApiToken}
                                    onChange={(e) => setCanvasApiToken(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleCanvasApiConnect}
                                disabled={!canvasApiToken || canvasLoading}
                            >
                                {canvasLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Connecting...
                                    </>
                                ) : (
                                    'Connect Canvas API'
                                )}
                            </Button>
                            {canvasError && <p className="text-red-500 mt-2">{canvasError.message}</p>}
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">When are you most productive?</h2>
                        <p className="text-gray-600 mb-6">This helps us tailor your experience.</p>
                        <div className="flex justify-between items-center bg-gray-100 rounded-lg p-2 mb-4">
                            <button
                                onClick={() => {
                                    setChronotype('morning')
                                    setStepsCompleted(prev => ({...prev, preference: true}))
                                }}
                                className={cn(
                                    "flex-1 flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200",
                                    chronotype === 'morning' ? "bg-yellow-100 shadow-md" : "hover:bg-gray-200"
                                )}
                            >
                                <Sun className="w-10 h-10 text-yellow-500" />
                                <span className="font-medium">Early Bird</span>
                            </button>
                            <button
                                onClick={() => {
                                    setChronotype('night')
                                    setStepsCompleted(prev => ({...prev, preference: true}))
                                }}
                                className={cn(
                                    "flex-1 flex flex-col items-center space-y-2 p-4 rounded-lg transition-all duration-200",
                                    chronotype === 'night' ? "bg-indigo-100 shadow-md" : "hover:bg-gray-200"
                                )}
                            >
                                <Moon className="w-10 h-10 text-indigo-500" />
                                <span className="font-medium">Night Owl</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-center text-gray-600 mb-4">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                                {chronotype === 'morning' 
                                    ? "We'll prioritize morning slots for you" 
                                    : "We'll keep evening slots open for you"}
                            </span>
                        </div>
                    </div>
                )
            case 4:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">All Set!</h2>
                        <p className="mb-4">You've successfully connected your accounts.</p>
                        <Check className="mx-auto h-16 w-16 text-green-500"/>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Onboarding</CardTitle>
                    <CardDescription>Complete these steps to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-8">
                        <div className="flex justify-between">
                            {steps.map((step, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            index <= currentStep ? "bg-primary text-primary-foreground" : "bg-gray-300"
                                        }`}
                                    >
                                        {index < currentStep ? <Check className="h-5 w-5"/> : index + 1}
                                    </div>
                                    <div className="text-xs mt-2 text-center">
                                        <div className="font-semibold">{step.title}</div>
                                        <div className="text-muted-foreground">{step.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 h-2 bg-gray-200 rounded-full">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                                style={{width: `${(currentStep / (steps.length - 1)) * 100}%`}}
                            ></div>
                        </div>
                    </div>
                    {renderStepContent()}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        disabled={currentStep === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!canProceed()}
                    >
                        {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Next'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
