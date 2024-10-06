'use client'

import {useState} from 'react'
import {Check, ArrowRight} from 'lucide-react'
import {Button} from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {Label} from "@/components/ui/label"

export default function OnboardingSteps() {
    const [completedSteps, setCompletedSteps] = useState({
        googleCalendar: false,
        canvasAPI: false,
        personalPreference: false,
    })

    const [schedulePreference, setSchedulePreference] = useState('')

    const handleStepComplete = (step: keyof typeof completedSteps) => {
        setCompletedSteps(prev => ({...prev, [step]: true}))
    }

    const handleSchedulePreference = (value: string) => {
        setSchedulePreference(value)
        handleStepComplete('personalPreference')
    }

    const allStepsCompleted = Object.values(completedSteps).every(Boolean)

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Welcome to Our Platform</h1>
            <p className="text-lg mb-8">Let's get you set up with the required integrations and preferences.</p>

            <Accordion type="single" collapsible className="mb-8">
                <AccordionItem value="google-calendar">
                    <AccordionTrigger className="flex items-center">
                        {completedSteps.googleCalendar && (
                            <Check className="w-5 h-5 text-green-500 mr-2"/>
                        )}
                        Connect Google Calendar
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <p>Follow these steps to connect your Google Calendar:</p>
                            <ol className="list-decimal list-inside">
                                <li>Click the "Connect Google Calendar" button below</li>
                                <li>Sign in to your Google account</li>
                                <li>Grant the necessary permissions</li>
                            </ol>
                            <Button onClick={() => handleStepComplete('googleCalendar')}>
                                Connect Google Calendar
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="canvas-api">
                    <AccordionTrigger className="flex items-center">
                        {completedSteps.canvasAPI && (
                            <Check className="w-5 h-5 text-green-500 mr-2"/>
                        )}
                        Connect Canvas API
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <p>Follow these steps to connect the Canvas API:</p>
                            <ol className="list-decimal list-inside">
                                <li>Log in to your Canvas account</li>
                                <li>Navigate to Settings &gt; Approved Integrations</li>
                                <li>Generate a new API token</li>
                                <li>Copy the token and paste it below</li>
                            </ol>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Paste your Canvas API token"
                                    className="flex-grow px-3 py-2 border rounded-md"
                                />
                                <Button onClick={() => handleStepComplete('canvasAPI')}>
                                    Connect Canvas API
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="personal-preference">
                    <AccordionTrigger className="flex items-center">
                        {completedSteps.personalPreference && (
                            <Check className="w-5 h-5 text-green-500 mr-2"/>
                        )}
                        Tell us more about you
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <p>Help us understand your schedule preference:</p>
                            <RadioGroup value={schedulePreference} onValueChange={handleSchedulePreference}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="morning" id="morning"/>
                                    <Label htmlFor="morning">I'm a morning person</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="night" id="night"/>
                                    <Label htmlFor="night">I'm a night person</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="afternoon" id="afternoon"/>
                                    <Label htmlFor="afternoon">I'm an afternoon person</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="flexible" id="flexible"/>
                                    <Label htmlFor="flexible">I'm flexible</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button
                className="w-full"
                disabled={!allStepsCompleted}
            >
                <ArrowRight className="w-5 h-5 mr-2"/>
                Let's talk
            </Button>
        </div>
    )
}