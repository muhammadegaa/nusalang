/**
 * WebSocket Runtime for NusaLang
 * Provides real-time data streaming capabilities
 */

/**
 * Active WebSocket connections
 */
const connections: Record<string, WebSocket> = {};

/**
 * Message handlers for each connection
 */
const handlers: Record<string, Set<(data: any) => void>> = {};

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * Subscribe to WebSocket messages from a URL
 * @param url WebSocket URL (ws:// or wss://)
 * @param handler Callback for incoming messages
 * @returns Unsubscribe function
 */
export function subscribe(
  url: string,
  handler: (data: any) => void
): () => void {
  // Initialize handler set for this URL
  if (!handlers[url]) {
    handlers[url] = new Set();
  }

  // Add handler
  handlers[url].add(handler);

  // Create connection if it doesn't exist
  if (!connections[url]) {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${url}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Notify all handlers for this URL
          handlers[url]?.forEach(h => {
            try {
              h(data);
            } catch (error) {
              console.error('[WebSocket] Handler error:', error);
            }
          });
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          // Pass raw data if JSON parsing fails
          handlers[url]?.forEach(h => h(event.data));
        }
      };

      ws.onerror = (error) => {
        console.error(`[WebSocket] Error on ${url}:`, error);
      };

      ws.onclose = () => {
        console.log(`[WebSocket] Disconnected from ${url}`);
        delete connections[url];
      };

      connections[url] = ws;
    } catch (error) {
      console.error(`[WebSocket] Failed to connect to ${url}:`, error);
    }
  }

  // Return unsubscribe function
  return () => {
    handlers[url]?.delete(handler);
    
    // Close connection if no more handlers
    if (handlers[url]?.size === 0) {
      connections[url]?.close();
      delete connections[url];
      delete handlers[url];
    }
  };
}

/**
 * Publish data to a WebSocket URL
 * @param url WebSocket URL
 * @param data Data to send (will be JSON stringified)
 */
export function publish(url: string, data: any): void {
  const ws = connections[url];

  if (!ws) {
    // Create new connection and send when ready
    const newWs = new WebSocket(url);
    
    newWs.onopen = () => {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        newWs.send(message);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    };

    newWs.onerror = (error) => {
      console.error(`[WebSocket] Error on ${url}:`, error);
    };

    connections[url] = newWs;
  } else if (ws.readyState === ConnectionState.OPEN) {
    // Connection is ready, send immediately
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      ws.send(message);
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
    }
  } else {
    // Connection exists but not ready, queue the message
    ws.addEventListener('open', () => {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        ws.send(message);
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    }, { once: true });
  }
}

/**
 * Get connection state for a URL
 */
export function getConnectionState(url: string): ConnectionState | null {
  const ws = connections[url];
  return ws ? ws.readyState : null;
}

/**
 * Close a specific WebSocket connection
 */
export function closeConnection(url: string): void {
  const ws = connections[url];
  if (ws) {
    ws.close();
    delete connections[url];
    delete handlers[url];
  }
}

/**
 * Close all WebSocket connections
 */
export function closeAllConnections(): void {
  Object.keys(connections).forEach(url => {
    connections[url].close();
  });
  Object.keys(connections).forEach(url => delete connections[url]);
  Object.keys(handlers).forEach(url => delete handlers[url]);
}

/**
 * Check if connected to a URL
 */
export function isConnected(url: string): boolean {
  const ws = connections[url];
  return ws?.readyState === ConnectionState.OPEN;
}

