/**
 * Tests for HTTP Server
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../runtime/server.js';
import http from 'http';

describe('HTTP Server', () => {
  let serverInstance: Awaited<ReturnType<typeof createServer>> | null;
  let port: number;
  let isRunning: boolean;

  beforeEach(async () => {
    port = 3000 + Math.floor(Math.random() * 1000);
    serverInstance = createServer({ port, host: 'localhost' });
    isRunning = false;
  });

  afterEach(async () => {
    if (serverInstance && isRunning) {
      try {
        await serverInstance.stop();
      } catch (error) {
        // Ignore errors if server is already stopped
      }
    }
    serverInstance = null;
    isRunning = false;
  });

  it('should create server instance', () => {
    expect(serverInstance).toBeDefined();
    expect(serverInstance.port).toBe(port);
    expect(serverInstance.host).toBe('localhost');
  });

  it('should start and stop server', async () => {
    await serverInstance!.start();
    isRunning = true;
    await serverInstance!.stop();
    isRunning = false;
  });

  it('should register and serve routes', async () => {
    serverInstance!.registerRoute('/test', async () => {
      return 'Hello from test route';
    });

    await serverInstance!.start();
    isRunning = true;

    const response = await makeRequest(`http://localhost:${port}/test`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Hello from test route');
  });

  it('should return 404 for unregistered routes', async () => {
    await serverInstance!.start();
    isRunning = true;

    const response = await makeRequest(`http://localhost:${port}/notfound`);
    expect(response.statusCode).toBe(404);
    expect(response.body).toContain('404 - Not Found');
  });

  it('should serve JSON for object responses', async () => {
    serverInstance!.registerRoute('/api/data', async () => {
      return { message: 'Hello', count: 42 };
    });

    await serverInstance!.start();
    isRunning = true;

    const response = await makeRequest(`http://localhost:${port}/api/data`);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    
    const data = JSON.parse(response.body);
    expect(data.message).toBe('Hello');
    expect(data.count).toBe(42);
  });

  it('should handle multiple routes', async () => {
    serverInstance!.registerRoute('/page1', async () => 'Page 1');
    serverInstance!.registerRoute('/page2', async () => 'Page 2');
    serverInstance!.registerRoute('/api/test', async () => ({ test: true }));

    await serverInstance!.start();
    isRunning = true;

    const resp1 = await makeRequest(`http://localhost:${port}/page1`);
    const resp2 = await makeRequest(`http://localhost:${port}/page2`);
    const resp3 = await makeRequest(`http://localhost:${port}/api/test`);

    expect(resp1.body).toContain('Page 1');
    expect(resp2.body).toContain('Page 2');
    expect(JSON.parse(resp3.body).test).toBe(true);
  });
});

/**
 * Helper function to make HTTP requests
 */
function makeRequest(url: string): Promise<{
  statusCode: number;
  headers: Record<string, any>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          headers: res.headers,
          body,
        });
      });
    }).on('error', reject);
  });
}

