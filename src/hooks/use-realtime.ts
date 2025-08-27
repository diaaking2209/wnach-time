
"use client"
import { useEffect, useRef } from 'react';
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

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const subscribeToChannel = () => {
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
                    console.error(`Subscription error on channel ${channelName}:`, err);
                }

                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to ${channelName}`);
                    retriesRef.current = 0; // Reset retries on successful connection
                    
                    // Start ping interval
                    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = setInterval(() => {
                        channel.send({ type: 'broadcast', event: 'ping', payload: {} });
                    }, 30000);

                } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
                    console.warn(`Channel ${channelName} timed out or had an error. Attempting to reconnect...`);
                    if (retriesRef.current < 5) {
                        retriesRef.current++;
                        setTimeout(() => subscribeToChannel(), 5000); // Wait 5 seconds before retrying
                    } else {
                        console.error(`Failed to reconnect to channel ${channelName} after 5 attempts.`);
                    }
                }
            });

            channelRef.current = channel;
        };
        
        subscribeToChannel();
        
        const handleVisibilityChange = () => {
            if(document.visibilityState === 'visible') {
                console.log(`Re-subscribing to ${channelName} due to visibility change.`);
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                }
                subscribeToChannel();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

    }, [channelName, table, filter, onEvent, enabled]);
};
