"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form, FormField, FormItem, FormLabel, FormDescription, FormMessage, FormControl } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function IntegrationForm() {
    const form = useForm<IntegrationFormValues>({
        resolver: zodResolver(integrationFormSchema),
        defaultValues,
    })

    function onSubmit(data: IntegrationFormValues) {
        console.log(data)
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
                                        <SelectValue placeholder="Select your primary calendar" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="primary">Primary Calendar</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Select your primary Google Calendar for scheduling tasks
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