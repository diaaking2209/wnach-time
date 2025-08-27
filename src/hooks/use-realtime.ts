
"use client"
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeProps {
    channelName: string;
    tableName: string;
    queryKey: (string | undefined)[];
    filter?: string;
    enabled?: boolean;
}

export const useRealtime = ({
    channelName,
    tableName,
    queryKey,
    filter,
    enabled = true
}: UseRealtimeProps) => {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    const cleanup = useCallback(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, []);

    const setupChannel = useCallback(() => {
        cleanup(); // Ensure no duplicate channels

        const channel = supabase.channel(channelName);

        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName, filter },
            (payload) => {
                // When a change is detected, invalidate the corresponding query.
                // TanStack Query will then automatically refetch the data.
                queryClient.invalidateQueries({ queryKey });
            }
        ).subscribe((status, err) => {
            if (err) {
                console.error(`[Realtime Error] Channel: ${channelName}`, err);
            }
        });

        channelRef.current = channel;

    }, [channelName, tableName, filter, queryClient, queryKey, cleanup]);

    useEffect(() => {
        if (!enabled) {
            cleanup();
            return;
        }

        setupChannel();
        
        return () => {
            cleanup();
        };

    }, [enabled, setupChannel, cleanup]);
};
