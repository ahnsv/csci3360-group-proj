'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { API_URL } from "@/app/_api/constants"
import Link from "next/link"

export default function SyncButton({ accessToken }: { accessToken: string }) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch(`${API_URL}/jobs/course-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      
      // Wait for 3 seconds before allowing another sync
      setTimeout(() => {
        setIsSyncing(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error syncing with Canvas:', error)
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <Button 
        onClick={handleSync} 
        disabled={isSyncing}
        className="min-w-[100px]"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>
      {isSyncing && (
        <Link 
          href="/settings/jobs" 
          className="text-xs text-blue-500 hover:text-blue-700 mt-1"
        >
          see details in jobs
        </Link>
      )}
    </div>
  )
} 