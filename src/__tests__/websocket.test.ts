/**
 * Tests for WebSocket Runtime (Phase 0.9)
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

// Simple WebSocket mock
class MockWebSocket {
  public readyState = 1;
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onclose: (() => void) | null = null;
  public lastSent: string | null = null;

  constructor(public url: string) {
    setTimeout(() => { if (this.onopen) this.onopen(); }, 0);
  }

  send(data: string) {
    this.lastSent = data;
  }

  close() {
    if (this.onclose) this.onclose();
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

(global as any).WebSocket = MockWebSocket;

import { subscribe, publish, closeAllConnections } from '../runtime/websocket.js';

describe('WebSocket Runtime', () => {
  afterEach(() => {
    closeAllConnections();
  });

  it('subscribes to messages', (done) => {
    const url = 'ws://test';
    subscribe(url, (data) => {
      expect(data).toEqual({ msg: 'hello' });
      done();
    });
    setTimeout(() => {
      const ws = (global as any).WebSocket.lastInstance;
      if (ws) ws.simulateMessage({ msg: 'hello' });
    }, 10);
  });

  it('publishes data', (done) => {
    const url = 'ws://test';
    publish(url, { msg: 'hi' });
    setTimeout(() => {
      const ws = (global as any).WebSocket.lastInstance;
      if (ws) {
        expect(ws.lastSent).toBe(JSON.stringify({ msg: 'hi' }));
        done();
      }
    }, 10);
  });

  it('supports multiple handlers', (done) => {
    const url = 'ws://test';
    let count = 0;
    subscribe(url, () => { count++; if (count === 2) done(); });
    subscribe(url, () => { count++; if (count === 2) done(); });
    setTimeout(() => {
      const ws = (global as any).WebSocket.lastInstance;
      if (ws) ws.simulateMessage({ test: true });
    }, 10);
  });

  it('unsubscribes correctly', (done) => {
    const url = 'ws://test';
    let calls = 0;
    const unsub = subscribe(url, () => { calls++; });
    setTimeout(() => {
      const ws = (global as any).WebSocket.lastInstance;
      if (ws) {
        ws.simulateMessage({});
        expect(calls).toBe(1);
        unsub();
        ws.simulateMessage({});
        expect(calls).toBe(1);
        done();
      }
    }, 10);
  });
});

// Track last instance
(MockWebSocket as any).lastInstance = null;
const Orig = MockWebSocket;
(global as any).WebSocket = class extends Orig {
  constructor(url: string) {
    super(url);
    (MockWebSocket as any).lastInstance = this;
  }
};
