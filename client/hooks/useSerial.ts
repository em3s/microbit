import { useState, useCallback, useEffect } from 'react';
import { WebSerialManager } from '../serial/WebSerialManager';
import { showToast } from '../components/Toast';

// 앱 전체에서 하나의 인스턴스 공유
const globalManager = new WebSerialManager();

// 토스트는 글로벌 리스너로 한 번만 등록
let toastRegistered = false;
if (!toastRegistered) {
  globalManager.on('connect', () => showToast('micro:bit 연결됨', 'success'));
  globalManager.on('disconnect', () => showToast('micro:bit 연결 끊김', 'error'));
  toastRegistered = true;
}

export function useSerial() {
  const [connected, setConnected] = useState(globalManager.isConnected());

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    globalManager.on('connect', onConnect);
    globalManager.on('disconnect', onDisconnect);

    setConnected(globalManager.isConnected());

    return () => {
      globalManager.off('connect', onConnect);
      globalManager.off('disconnect', onDisconnect);
    };
  }, []);

  const connect = useCallback(() => globalManager.connect(), []);
  const disconnect = useCallback(() => globalManager.disconnect(), []);

  return { manager: globalManager, connected, connect, disconnect };
}
