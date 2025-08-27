
"use client"
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeProps {
    channel: string;
    table: string;
    filter?: string;
    onEvent: (payload: RealtimePostgresChangesPayload<any>) => void;
    enabled?: boolean;
}

export const useRealtime = ({
    channel: channelName,
    table,
    filter,
    onEvent,
    enabled = true
}: UseRealtimeProps) => {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const retriesRef = useRef(0);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, []);

    const subscribeToChannel = useCallback(() => {
        cleanup(); // Clean up any existing channel before creating a new one

        const channel = supabase.channel(channelName, {
            config: {
                broadcast: {
                    self: true,
                },
            },
        });

        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table, filter },
            (payload) => {
                onEvent(payload);
            }
        ).subscribe((status, err) => {
            if (err) {
                console.error(`[Realtime Error] Channel: ${channelName}`, err);
            }

            if (status === 'SUBSCRIBED') {
                console.log(`[Realtime] Subscribed to ${channelName}`);
                retriesRef.current = 0;
                
                if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = setInterval(() => {
                    if (channel.state === 'open') {
                        channel.send({ type: 'broadcast', event: 'ping', payload: {} });
                    }
                }, 30000);

            } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
                console.warn(`[Realtime] Channel ${channelName} timed out or had an error. Reconnecting...`);
                if (retriesRef.current < 5) {
                    retriesRef.current++;
                    setTimeout(() => subscribeToChannel(), 2000 * (retriesRef.current)); 
                } else {
                    console.error(`[Realtime] Failed to reconnect to ${channelName} after 5 attempts.`);
                }
            } else if (status === 'CLOSED') {
                 console.log(`[Realtime] Channel ${channelName} closed. Will attempt to reconnect on next interaction or visibility change.`);
            }
        });

        channelRef.current = channel;
    }, [channelName, table, filter, onEvent, cleanup]);

    useEffect(() => {
        if (!enabled) {
            cleanup();
            return;
        }

        subscribeToChannel();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[Realtime] Page is visible again. Re-subscribing...');
                subscribeToChannel();
            }
        }
        
        const handlePageShow = (event: PageTransitionEvent) => {
             if (event.persisted) {
                console.log('[Realtime] Page was restored from BFCache. Re-subscribing...');
                subscribeToChannel();
             }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            cleanup();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handlePageShow);
        };

    }, [enabled, subscribeToChannel, cleanup]);
};
