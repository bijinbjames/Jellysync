import React, { createContext, useContext } from 'react';
import { useWebSocket, type UseWebSocket } from '../hooks/use-websocket';

const WebSocketContext = createContext<UseWebSocket | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket();

  return <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>;
}

export function useWs(): UseWebSocket {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWs must be used within a WebSocketProvider');
  }
  return context;
}
