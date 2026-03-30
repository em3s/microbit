import { useRef, useState, useCallback, useEffect } from 'react';
import { WebSerialManager } from '../serial/WebSerialManager';

export function useSerial() {
  const managerRef = useRef(new WebSerialManager());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const mgr = managerRef.current;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    mgr.on('connect', onConnect);
    mgr.on('disconnect', onDisconnect);

    return () => {
      mgr.off('connect', onConnect);
      mgr.off('disconnect', onDisconnect);
      mgr.disconnect();
    };
  }, []);

  const connect = useCallback(() => managerRef.current.connect(), []);
  const disconnect = useCallback(() => managerRef.current.disconnect(), []);

  return { manager: managerRef.current, connected, connect, disconnect };
}
