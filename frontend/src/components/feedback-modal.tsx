"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createSupabaseClient } from "@/lib/supabase/client"

export function FeedbackModal() {
    const [rating, setRating] = React.useState<number>(0)
    const [useNextSemester, setUseNextSemester] = React.useState<boolean | null>(null)
    const [wantContribute, setWantContribute] = React.useState<boolean | null>(null)
    const [email, setEmail] = React.useState("")
    const [message, setMessage] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const { toast } = useToast()
    const supabase = createSupabaseClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!rating || useNextSemester === null || wantContribute === null) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('No user found')
            }

            const { error } = await supabase.from('feedback').insert({
                user_id: user.id,
                rating,
                use_next_semester: useNextSemester,
                want_contribute: wantContribute,
                email: wantContribute ? email : null,
                message: wantContribute ? message : null,
            })

            if (error) throw error

            toast({
                title: "Thank you for your feedback!",
                description: "Your response has been recorded.",
            })

            // Reset form and close modal
            setRating(0)
            setUseNextSemester(null)
            setWantContribute(null)
            setEmail("")
            setMessage("")
            setOpen(false)

        } catch (error) {
            console.error('Error submitting feedback:', error)
            toast({
                title: "Error submitting feedback",
                description: "Please try again later",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="font-semibold">
                    Share Your Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Project Feedback</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>How would you rate this project? (1-5)</Label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <Button
                                    key={num}
                                    type="button"
                                    variant={rating === num ? "default" : "outline"}
                                    className="w-10 h-10"
                                    onClick={() => setRating(num)}
                                >
                                    {num}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Would you like to use this app next semester?</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={useNextSemester === true ? "default" : "outline"}
                                onClick={() => setUseNextSemester(true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={useNextSemester === false ? "default" : "outline"}
                                onClick={() => setUseNextSemester(false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Are you interested in contributing to this project?</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={wantContribute === true ? "default" : "outline"}
                                onClick={() => setWantContribute(true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={wantContribute === false ? "default" : "outline"}
                                onClick={() => setWantContribute(false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {wantContribute && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Tell us more (optional)</Label>
                                <Input
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Your thoughts..."
                                />
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
} 