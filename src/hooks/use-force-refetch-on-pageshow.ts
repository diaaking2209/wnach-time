
"use client"

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

/**
 * This hook is designed to combat the browser's Back-Forward Cache (BFCache).
 * BFCache can cause stale data to be displayed when a user navigates back to a page.
 * This hook listens for the 'pageshow' event and invalidates all TanStack Query
 * queries if the page is being restored from the BFCache, ensuring fresh data is fetched.
 */
export function useForceRefetchOnPageshow() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = (event: PageTransitionEvent) => {
      // The `persisted` property is true if the page is being restored from BFCache.
      if (event.persisted) {
        queryClient.invalidateQueries();
      }
    };

    window.addEventListener('pageshow', handler);
    return () => window.removeEventListener('pageshow', handler);
  }, [queryClient]);
}
