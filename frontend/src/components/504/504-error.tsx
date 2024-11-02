'use client'

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { Timer, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Component() {
  const [progress, setProgress] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer)
          return 100
        }
        return Math.min(oldProgress + 1, 100)
      })
    }, 1200) // 2 minutes = 120 seconds, update every 1.2s for smooth animation

    return () => clearInterval(timer)
  }, [attempt])

  const handleRetry = () => {
    setProgress(0)
    setAttempt(a => a + 1)
    router.push('/')
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">Gateway Timeout</h1>
          <p className="text-muted-foreground">
            The server is taking longer than expected to respond. This usually happens during cold starts.
          </p>
        </div>
        
        <div className="space-y-4 p-4 rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Timer className="h-5 w-5" />
            <span>Server is warming up...</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <p className="text-sm text-muted-foreground">
            {progress < 100 
              ? "This may take up to 2 minutes" 
              : "Server should be ready now"}
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Using Render.com? Free tier instances automatically spin down after 15 minutes of inactivity.
          </p>
        </div>
      </div>
    </div>
  )
}