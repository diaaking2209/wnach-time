"use client"
import { useEffect, useRef } from 'react';
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

/**
 * A robust hook to subscribe to Supabase Realtime changes.
 * It properly handles the lifecycle of the subscription:
 * - Subscribes when the component mounts (and `enabled` is true).
 * - Invalidates the corresponding react-query cache on receiving a new event.
 * - Unsubscribes and cleans up the channel when the component unmounts.
 * This prevents memory leaks and multiple unnecessary connections.
 */
export const useRealtime = ({
    channelName,
    tableName,
    queryKey,
    filter,
    enabled = true
}: UseRealtimeProps) => {
    const queryClient = useQueryClient();
    // Use a ref to store the channel instance so it persists across re-renders.
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        // Only run the effect if the subscription is enabled and we have a valid channel name.
        if (!enabled || !channelName) {
            return;
        }

        // Create the channel instance.
        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // Set up the subscription.
        const subscription = channelRef.current
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName, filter },
                (payload) => {
                    console.log(`[Realtime] Change received on ${tableName}:`, payload);
                    // When a change is detected, invalidate the query to force a refetch.
                    queryClient.invalidateQueries({ queryKey });
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error(`[Realtime] Subscription error on channel ${channelName}:`, err);
                } else {
                    console.log(`[Realtime] Subscribed to ${channelName} with status: ${status}`);
                }
            });

        // --- This is the crucial cleanup function ---
        // It runs when the component unmounts or dependencies change.
        return () => {
            if (channelRef.current) {
                console.log(`[Realtime] Unsubscribing from channel: ${channelName}`);
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };

    // The effect depends on these values. If they change, it will re-run,
    // cleaning up the old subscription and creating a new one.
    // JSON.stringify is used for the queryKey array to prevent re-runs on every render.
    }, [enabled, channelName, tableName, filter, queryClient, JSON.stringify(queryKey)]);
};
