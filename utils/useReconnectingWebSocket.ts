import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionState } from '../components/trading/types';

interface ReconnectingWSOptions {
    /** Maximum number of reconnection attempts (default: 10) */
    maxRetries?: number;
    /** Initial delay in ms before first retry (default: 1000) */
    baseDelay?: number;
    /** Maximum delay in ms between retries (default: 30000) */
    maxDelay?: number;
}

interface ReconnectingWSResult {
    /** The current WebSocket instance, or null if not connected */
    ws: WebSocket | null;
    /** Current connection state */
    connectionState: ConnectionState;
    /** Error message if connection failed */
    connectionError: string | null;
    /** Number of reconnection attempts so far */
    retryCount: number;
    /** Manually trigger a reconnect */
    reconnect: () => void;
}

const DEFAULT_MAX_RETRIES = 10;
const DEFAULT_BASE_DELAY = 1000;
const DEFAULT_MAX_DELAY = 30_000;

/**
 * WebSocket hook with automatic exponential backoff reconnection.
 *
 * Returns the current WebSocket instance, connection state, and a reconnect method.
 * The `onOpen` callback is called after each successful connection — use it
 * to send subscription messages.
 */
export function useReconnectingWebSocket(
    url: string,
    onOpen?: (ws: WebSocket) => void,
    onMessage?: (event: { data?: unknown }) => void,
    options?: ReconnectingWSOptions,
): ReconnectingWSResult {
    const { maxRetries = DEFAULT_MAX_RETRIES, baseDelay = DEFAULT_BASE_DELAY, maxDelay = DEFAULT_MAX_DELAY } = options ?? {};

    const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [ws, setWs] = useState<WebSocket | null>(null);

    const isMountedRef = useRef(true);
    const retryCountRef = useRef(0);
    const wsRef = useRef<WebSocket | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Store latest callbacks in refs to avoid re-creating the WebSocket on
    // every callback change.
    const onOpenRef = useRef(onOpen);
    onOpenRef.current = onOpen;
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const connect = useCallback(() => {
        if (!isMountedRef.current) return;

        // Clean up previous
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            wsRef.current.onmessage = null;
            wsRef.current.close();
        }

        setConnectionState('loading');
        setConnectionError(null);

        const socket = new WebSocket(url);
        wsRef.current = socket;
        setWs(socket);

        socket.onopen = () => {
            if (!isMountedRef.current) return;
            retryCountRef.current = 0;
            setRetryCount(0);
            setConnectionState('open');
            setConnectionError(null);
            onOpenRef.current?.(socket);
        };

        socket.onmessage = (event) => {
            if (!isMountedRef.current) return;
            onMessageRef.current?.(event);
        };

        socket.onerror = () => {
            if (!isMountedRef.current) return;
            setConnectionState('error');
            setConnectionError('WebSocket connection error.');
        };

        socket.onclose = () => {
            if (!isMountedRef.current) return;

            const attempt = retryCountRef.current;
            if (attempt < maxRetries) {
                const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
                retryCountRef.current = attempt + 1;
                setRetryCount(attempt + 1);
                setConnectionState('loading');
                setConnectionError(`Reconnecting (${attempt + 1}/${maxRetries})…`);

                retryTimerRef.current = setTimeout(() => {
                    if (isMountedRef.current) connect();
                }, delay);
            } else {
                setConnectionState('error');
                setConnectionError('Connection lost. Tap to reconnect.');
            }
        };
    }, [url, maxRetries, baseDelay, maxDelay]);

    const reconnect = useCallback(() => {
        retryCountRef.current = 0;
        setRetryCount(0);
        connect();
    }, [connect]);

    useEffect(() => {
        isMountedRef.current = true;
        connect();

        return () => {
            isMountedRef.current = false;
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.onmessage = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { ws, connectionState, connectionError, retryCount, reconnect };
}
