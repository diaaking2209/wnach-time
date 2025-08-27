
"use client";

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Custom hook that forces all TanStack queries to refetch when the page becomes visible,
 * particularly after being restored from the Back/Forward Cache (BFCache).
 * This solves the issue where data becomes stale after navigating back to a page.
 */
export function useForceRefetchOnPageshow() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      // The `persisted` property is true if the page is restored from BFCache.
      if (event.persisted) {
        // Invalidate all queries to force a refetch.
        queryClient.invalidateQueries();
      }
    };

    window.addEventListener('pageshow', onPageShow);
    
    // Cleanup the event listener when the component unmounts.
    return () => {
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [queryClient]);
}
