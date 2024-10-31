'use client';

import {useState, useEffect} from 'react'
import Link from "next/link"
import {Github, Chrome} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {createSupabaseClient} from "@/lib/supabase/client";

export default function Component() {
    const [mounted, setMounted] = useState(false)
    const supabase = createSupabaseClient()

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div className="flex min-h-screen">
            <div className="hidden w-1/2 lg:block bg-gradient-to-br from-purple-600 to-blue-500">
                <div className="flex items-center justify-center h-full">
                    <h1 className="text-4xl font-bold text-white text-center px-8">
                        {mounted && (
                            <span className="inline-block animate-fade-in-up tracking-tighter">
                                Connect and make<br/> your day like a pro
                            </span>
                        )}
                    </h1>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-100 select-none">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                        <CardDescription className="text-center">
                            Choose your login method
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() =>
                                supabase.auth.signInWithOAuth({
                                    provider: 'github',
                                    options: {
                                        redirectTo: `${location.origin}/auth/callback`
                                    }
                                })
                            }>
                                <Github className="mr-2 h-4 w-4"/>
                                Github
                            </Button>
                            <Button variant="outline" onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${location.origin}/auth/callback`,
                                    }
                                })
                            }}>
                                <Chrome className="mr-2 h-4 w-4"/>
                                Google
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                            <span className="mr-1">Don&apos;t have an account?</span>
                            <Link className="underline" href="#">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}