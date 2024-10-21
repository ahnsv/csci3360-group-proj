import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { API_URL } from "@/app/_api/constants"

export function useGoogleAuth(redirectPath: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/google/status`)
        const data = await response.json()
        setIsConnected(data.connected)
      } catch (err) {
        setError('Failed to check Google connection status')
      } finally {
        setIsLoading(false)
      }
    }

    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'true') {
      setIsConnected(true)
      router.replace(redirectPath)
    } else if (error === 'true') {
      setError('Failed to connect Google Calendar')
      router.replace(redirectPath)
    } else {
      checkConnectionStatus()
    }
  }, [searchParams, router, redirectPath])

  const connectGoogleCalendar = () => {
    const currentUrl = new URL(window.location.href)
    const redirectUri = `${currentUrl.origin}${redirectPath}`
    window.location.href = `${API_URL}/auth/google/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  return { isConnected, isLoading, error, connectGoogleCalendar }
}
