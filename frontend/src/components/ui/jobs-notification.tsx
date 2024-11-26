'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/app/_api/constants'
import { useAuth } from '@/contexts/AuthContext'

interface Job {
  id: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  created_at: string
  error_message?: string
}

export function JobsNotification({ accessToken }: { accessToken?: string }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  if (!accessToken) {
    return null
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/?limit=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
        const pending = data.filter((job: Job) => job.status === 'PENDING').length
        setPendingCount(pending)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [accessToken])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-[10px] font-medium text-white">
                {pendingCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <div className="p-2">
          <h3 className="font-semibold mb-2">Recent Sync Jobs</h3>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent jobs</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="text-sm flex items-center justify-between p-2 rounded-md bg-muted"
                >
                  <div>
                    <span className="font-medium">Sync Job #{job.id}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 