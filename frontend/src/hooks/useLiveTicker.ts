import { useState, useEffect, useRef } from 'react';

export interface LiveTickData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  direction: 'up' | 'down' | 'flat';
  lastTickTime: number;
  isConnected: boolean;
  tickCount: number;
}

export const useLiveTicker = (
  ticker: string,
  initialPrice?: number,
  initialChange?: number,
  initialChangePercent?: number,
  initialVolume?: number
): LiveTickData => {
  const [price, setPrice] = useState<number>(initialPrice ?? 0);
  const [change, setChange] = useState<number>(initialChange ?? 0);
  const [changePercent, setChangePercent] = useState<number>(initialChangePercent ?? 0);
  const [volume, setVolume] = useState<number>(initialVolume ?? 0);
  const [direction, setDirection] = useState<'up' | 'down' | 'flat'>('flat');
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tickCount, setTickCount] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);

  // Sync with initial props if loaded
  useEffect(() => {
    if (initialPrice && price === 0) setPrice(initialPrice);
    if (initialChange !== undefined && change === 0) setChange(initialChange);
    if (initialChangePercent !== undefined && changePercent === 0) setChangePercent(initialChangePercent);
    if (initialVolume && volume === 0) setVolume(initialVolume);
  }, [initialPrice, initialChange, initialChangePercent, initialVolume, price, change, changePercent, volume]);

  useEffect(() => {
    if (!ticker) return;

    let isMounted = true;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      // Determine ws protocol and host
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      // In dev backend runs on port 8000
      const wsHost = import.meta.env.VITE_WS_URL || '127.0.0.1:8000';
      const wsUrl = `${wsProtocol}//${wsHost}/api/v1/stocks/${encodeURIComponent(ticker)}/live-ws`;

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.price !== undefined) {
              setPrice(data.price);
              setChange(data.change);
              setChangePercent(data.change_percent);
              setVolume(data.volume);
              setDirection(data.direction || 'flat');
              setLastTickTime(data.timestamp || Date.now());
              setTickCount((prev) => prev + 1);
            }
          } catch (e) {
            console.error('Error parsing live tick message:', e);
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Try reconnecting after 2 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        };

        socket.onerror = () => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [ticker]);

  return {
    price,
    change,
    changePercent,
    volume,
    direction,
    lastTickTime,
    isConnected,
    tickCount,
  };
};
