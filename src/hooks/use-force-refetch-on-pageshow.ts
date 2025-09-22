
"use client"

import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * This hook is designed to combat the browser's Back-Forward Cache (BFCache).
 * BFCache can cause stale data to be displayed when a user navigates back to a page.
 * This hook listens for the 'pageshow' event and invalidates all TanStack Query
 * queries if the page is being restored from the BFCache, ensuring fresh data is fetched.
 */
export function useForceRefetchOnPageshow(queryClient: QueryClient) {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      const persisted = (e as any).persisted
      if (persisted) {
        // Only refetch when returning from BFCache
        queryClient.invalidateQueries()
      }
    }
    window.addEventListener('pageshow', onPageShow as EventListener)
    return () => window.removeEventListener('pageshow', onPageShow as EventListener)
  }, [queryClient])
}
