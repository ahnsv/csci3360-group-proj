'use client'

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { Form, FormField } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"

function PromptForm() {
  const promptFormSchema = z.object({
    taskExtractionPrompt: z.string()
      .min(10, {
        message: "Task extraction prompt must be at least 10 characters.",
      })
      .max(1000, {
        message: "Task extraction prompt must not be longer than 1000 characters.", 
      }),
    schedulingPrompt: z.string()
      .min(10, {
        message: "Scheduling prompt must be at least 10 characters.",
      })
      .max(1000, {
        message: "Scheduling prompt must not be longer than 1000 characters.",
      })
  })

  type PromptFormValues = z.infer<typeof promptFormSchema>

  const defaultValues: Partial<PromptFormValues> = {
    taskExtractionPrompt: "Extract key tasks and deadlines from the following text:",
    schedulingPrompt: "Based on these tasks and my calendar, recommend a schedule:"
  }

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
    mode: "onChange",
  })

  function onSubmit(data: PromptFormValues) {
    toast({
      title: "You submitted the following prompts:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="taskExtractionPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Extraction Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter prompt for task extraction"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This prompt will be used to extract tasks and deadlines from text.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="schedulingPrompt" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduling Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter prompt for scheduling recommendations"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This prompt will be used to generate scheduling recommendations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update Prompts</Button>
      </form>
    </Form>
  )
}

export default PromptForm