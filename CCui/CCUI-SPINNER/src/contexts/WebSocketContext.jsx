import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext(null);

export const WebSocketProvider = (props) => {
  const { children } = props;
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  
  // Helper to get cookie by name
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const token = getCookie('jwt') || 'dev-token'; // Fallback for dev
      const wsUrl = `${protocol}//${host}/ws?token=${token}`;
      
      console.log('Connecting to WS:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WS Connected');
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log('WS Disconnected');
        setIsConnected(false);
        // Reconnect logic could go here
        setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      setSocket(ws);
      
      return ws;
    } catch (e) {
      console.error("WS Connection failed", e);
      return null;
    }
  };

  useEffect(() => {
    const ws = connect();
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const sendMessage = (msg) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(msg));
    } else {
      console.warn("WS not connected, cannot send:", msg);
    }
  };

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);