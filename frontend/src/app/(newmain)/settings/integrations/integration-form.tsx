"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form, FormField, FormItem, FormLabel, FormDescription, FormMessage, FormControl } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { API_URL } from "@/app/_api/constants"
import { useAuth } from "@/contexts/AuthContext"
import { createSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

async function getCalendars(accessToken: string) {
    const response = await fetch(`${API_URL}/auth/google/calendars`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    })
    if (!response.ok) {
        throw new Error("Failed to fetch calendars")
    }
    return response.json()
}

interface IntegrationFormValues {
    googleCalendar: string
}

const integrationFormSchema = z.object({
    googleCalendar: z.string({
        required_error: "Please select a Google Calendar"
    })
})

const defaultValues: Partial<IntegrationFormValues> = {
    googleCalendar: ""
}

const getMyPreference = async () => {
    const supabase = createSupabaseClient()
    const { data: { user }} = await supabase.auth.getUser()
    const { data, error } = await supabase
        .from("preference")
        .select("id")
        .eq("user_id", user?.id)
        .single()
    if (error) {
        throw error
    }
    return data?.id
}

export default function IntegrationForm() {
    const [preferenceId, setPreferenceId] = useState<number | undefined>(undefined)
    const [calendars, setCalendars] = useState<{id: string, name: string, accessRole: string}[]>([])
    const [loading, setLoading] = useState(true)
    const { accessToken } = useAuth()

    const form = useForm<IntegrationFormValues>({
        resolver: zodResolver(integrationFormSchema),
        defaultValues,
    })

    useEffect(() => {
        const loadPreferenceId = async () => {
            const id = await getMyPreference()
            if (id) {
                setPreferenceId(id)
            }
        }
        loadPreferenceId()

        async function loadCalendars() {
            try {
                const data = await getCalendars(accessToken)
                setCalendars(data)
            } catch (error) {
                console.error("Failed to load calendars:", error)
            } finally {
                setLoading(false)
            }
        }
        loadCalendars()
    }, [])

    async function onSubmit(data: IntegrationFormValues) {
        const supabase = createSupabaseClient()
        const { data: { user }} = await supabase.auth.getUser()

        const { error: userError } = await supabase
            .from("preference")
            .upsert({
                id: preferenceId,
                user_id: user?.id,
                primary_calendar: data.googleCalendar
            })
            .select()
            .single()
        
        if (userError) {
            toast({
                title: "Error",
                description: "Failed to update user preference",
                variant: "destructive"
            })
        } else {
            toast({
                title: "Success",
                description: "User preference updated"
            })
        }
    }

    if (loading) {
        return <div>Loading calendars...</div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="googleCalendar"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Calendar</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a calendar" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {calendars.map((calendar: {id: string, name: string}) => (
                                        <SelectItem key={calendar.id} value={calendar.id}>
                                            {calendar.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select your Google Calendar for scheduling tasks
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Save Changes</Button>
            </form>
        </Form>
    )
}