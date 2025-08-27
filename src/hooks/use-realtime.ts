
"use client"
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
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

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const channel = supabase.channel(channelName);

        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName, filter },
            () => {
                queryClient.invalidateQueries({ queryKey });
            }
        ).subscribe();

        channelRef.current = channel;
        
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };

    }, [enabled, channelName, tableName, filter, queryKey, queryClient]);
};
