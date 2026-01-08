import { useEffect, useCallback } from 'react';
import websocketService from '../services/websocket';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && !websocketService.isConnected()) {
      websocketService.connect(user.id, user.role);
    }

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // websocketService.disconnect();
    };
  }, [user]);

  const subscribe = useCallback((event, callback) => {
    websocketService.on(event, callback);

    return () => {
      websocketService.off(event, callback);
    };
  }, []);

  const send = useCallback((event, data) => {
    websocketService.send(event, data);
  }, []);

  return {
    subscribe,
    send,
    isConnected: websocketService.isConnected()
  };
};
