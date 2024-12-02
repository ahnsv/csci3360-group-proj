'use client'

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { Form, FormField } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

async function getPrompts() {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return undefined
  }
  const { data, error } = await supabase.from("preference").select("id, task_extraction_prompt, scheduling_prompt").eq("user_id", user.id).single()
  if (error) {
    throw error
  }
  return data
}

function PromptForm() {
  const supabase = createSupabaseClient()
  const [preferenceId, setPreferenceId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

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
    taskExtractionPrompt: "",
    schedulingPrompt: ""
  }

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
    mode: "onChange",
  })

  useEffect(() => {
    async function loadPrompts() {
      try {
        const data = await getPrompts()
        if (data) {
          setPreferenceId(data.id.toString())
          form.reset({
            taskExtractionPrompt: data.task_extraction_prompt || "",
            schedulingPrompt: data.scheduling_prompt || ""
          })
        }
      } catch (error) {
        toast({
          title: "Error loading prompts",
          description: "Failed to load existing prompts.",
        })
      } finally {
        setLoading(false)
      }
    }
    loadPrompts()
  }, [form])

  async function onSubmit(data: PromptFormValues) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!preferenceId) {
      const { data: newPreference, error: newPreferenceError } = await supabase.from("preference").insert({
        user_id: user?.id,
        task_extraction_prompt: data.taskExtractionPrompt,
        scheduling_prompt: data.schedulingPrompt
      }).select().single()
      if (newPreferenceError) {
        toast({
          title: "Error creating preference",
          description: newPreferenceError.message,
        })
      }
      if (newPreference) {
        setPreferenceId(newPreference.id.toString())
      }
      return
    }
    const { error } = await supabase.from("preference").upsert({
      id: Number(preferenceId),
      user_id: user?.id,
      task_extraction_prompt: data.taskExtractionPrompt,
      scheduling_prompt: data.schedulingPrompt
    }).select()

    if (error) {
      toast({
        title: "Error updating prompts",
        description: error.message,
      })
    }

    toast({
      title: "Prompts updated",
      description: "Your prompts have been updated.",
    })
  }

  if (loading) {
    return <div>Loading...</div>
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
              <FormDescription aria-placeholder="Enter prompt for task extraction">
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