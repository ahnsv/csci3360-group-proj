"use client"

import { useCanvasConnect } from "@/app/_api/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGoogleAuth } from "@/hooks/useGoogleAuth"
import { Calendar, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function OnboardingSteps({accessToken}: { accessToken: string }) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [canvasApiToken, setCanvasApiToken] = useState("")
    const {isConnected, isLoading, error, connectGoogleCalendar} = useGoogleAuth('/onboard', accessToken)

    const steps = [
        {title: "Welcome", description: "Start your onboarding process"},
        {title: "Connect Google Calendar", description: "Sync your schedule"},
        {title: "Connect Canvas API", description: "Access your course information"},
        {title: "All Set!", description: "You're ready to go"},
    ]
    const {isLoading: canvasLoading, error: canvasError, execute: canvasConnect} = useCanvasConnect();


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
                setCurrentStep(currentStep + 1);
            } else {
                throw new Error(message || 'Failed to connect to Canvas API');
            }
        } catch (error) {
            console.error('Error connecting to Canvas API:', error);
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Welcome to Our SaaS Platform</h2>
                        <p className="mb-4">Let's get you set up with your calendar and course information.</p>
                        <Button onClick={() => setCurrentStep(currentStep + 1)}>Get Started</Button>
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
                                <Button onClick={() => setCurrentStep(currentStep + 1)}>Next Step</Button>
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
                        <p className="mb-4">Enter your Canvas API token to access your course information.</p>
                        <div className="mb-4 p-4 border-l-4 border-red-500 bg-red-100 text-red-700">
                            <strong>Note:</strong> You can find your Canvas API token in your Canvas account settings under "Account" &gt; "Settings" &gt; "Approved Integrations" &gt; "New Access Token"
                        </div>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-full max-w-sm">
                                <Label htmlFor="api-token">Canvas API Token</Label>
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
                        <h2 className="text-2xl font-bold mb-4">All Set!</h2>
                        <p className="mb-4">You've successfully connected your accounts.</p>
                        <Check className="mx-auto h-16 w-16 text-green-500"/>
                        <Button onClick={() => {
                            console.log("Onboarding complete!");
                            router.push('/')
                        }} className="mt-4">
                            Go to Dashboard
                        </Button>
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
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                        disabled={currentStep === steps.length - 1}
                    >
                        Next
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
