'use client'
import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'

export default function useForceRefetchOnPageShow(queryClient: QueryClient) {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      const persisted = (e as any).persisted
      if (persisted) {
        // Invalidate all queries when returning from BFCache
        queryClient.invalidateQueries()
      }
    }
    window.addEventListener('pageshow', onPageShow as EventListener)
    return () => window.removeEventListener('pageshow', onPageShow as EventListener)
  }, [queryClient])
}
