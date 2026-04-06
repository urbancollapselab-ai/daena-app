import { create } from 'zustand';

interface WSState {
  socket: WebSocket | null;
  connected: boolean;
  pendingRequests: Map<string, { resolve: Function; reject: Function }>;
  eventListeners: Map<string, Function[]>;
  connect: (port?: number) => void;
  send: (method: string, params?: any) => Promise<any>;
  onEvent: (eventType: string, handler: Function) => void;
}

export const useWSStore = create<WSState>((set, get) => ({
  socket: null,
  connected: false,
  pendingRequests: new Map(),
  eventListeners: new Map(),

  connect: (port = 8910) => {
    // Avoid double connect
    if (get().connected) return;

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    ws.onopen = () => set({ connected: true });
    
    ws.onclose = () => {
      set({ connected: false });
      // Retry logic
      setTimeout(() => get().connect(port), 2000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.id && get().pendingRequests.has(msg.id)) {
          const { resolve } = get().pendingRequests.get(msg.id)!;
          if (msg.type === 'stream_end' || msg.result !== undefined) {
            resolve(msg.result || msg);
            get().pendingRequests.delete(msg.id);
          }
        } else if (msg.type === 'event') {
          const listeners = get().eventListeners.get(msg.event) || [];
          listeners.forEach(fn => fn(msg.data));
        }
      } catch (err) {
        console.error("WS Parse error", err);
      }
    };

    set({ socket: ws });
  },

  send: (method, params = {}) => {
    return new Promise((resolve, reject) => {
      if (!get().connected || !get().socket) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const id = crypto.randomUUID();
      get().pendingRequests.set(id, { resolve, reject });
      get().socket?.send(JSON.stringify({ id, method, params }));
    });
  },

  onEvent: (eventType, handler) => {
    const current = get().eventListeners.get(eventType) || [];
    current.push(handler);
    get().eventListeners.set(eventType, current);
  }
}));
