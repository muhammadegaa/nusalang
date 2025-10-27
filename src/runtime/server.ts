/**
 * HTTP Server for NusaLang
 * Minimal server using Node's built-in http module
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { router } from './router.js';

type RouteHandler = () => Promise<any>;

export interface ServerOptions {
  port?: number;
  host?: string;
  staticDir?: string;
  hotReload?: boolean;
}

export interface ServerInstance {
  server: http.Server;
  port: number;
  host: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  registerRoute: (path: string, handler: RouteHandler) => void;
}

/**
 * Create HTTP server instance
 */
export function createServer(options: ServerOptions = {}): ServerInstance {
  const {
    port = 3000,
    host = 'localhost',
    staticDir = './public',
    hotReload = false,
  } = options;

  const server = http.createServer(async (req, res) => {
    try {
      await handleRequest(req, res, { staticDir, hotReload });
    } catch (error) {
      console.error('[Server Error]', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  return {
    server,
    port,
    host,
    
    async start() {
      return new Promise((resolve, reject) => {
        server.listen(port, host, () => {
          console.log(`🚀 NusaLang server running at http://${host}:${port}`);
          resolve();
        });
        
        server.on('error', reject);
      });
    },
    
    async stop() {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else {
            console.log('🛑 Server stopped');
            resolve();
          }
        });
      });
    },
    
    registerRoute(routePath: string, handler: RouteHandler) {
      router.registerPage(routePath, handler);
    },
  };
}

/**
 * Handle incoming HTTP requests
 */
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  options: { staticDir: string; hotReload: boolean }
): Promise<void> {
  const url = req.url || '/';
  const method = req.method || 'GET';
  
  console.log(`${method} ${url}`);
  
  // Try to match a registered route
  const route = router.getPage(url);
  
  if (route) {
    try {
      const result = await route.handler();
      
      // If result is an object, send as JSON
      if (typeof result === 'object' && result !== null) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
        return;
      }
      
      // Otherwise send as HTML
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(wrapInHTML(String(result), url));
      return;
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error executing route: ${(error as Error).message}`);
      return;
    }
  }
  
  // Serve static files
  if (method === 'GET') {
    const filePath = path.join(options.staticDir, url);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const contentType = getContentType(filePath);
      const content = fs.readFileSync(filePath);
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  }
  
  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(wrapInHTML(`
    <h1>404 - Not Found</h1>
    <p>The page <code>${url}</code> was not found.</p>
    <p><a href="/">Go home</a></p>
  `, '404'));
}

/**
 * Wrap content in basic HTML template
 */
function wrapInHTML(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NusaLang - ${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

/**
 * Get MIME content type for file
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
  };
  
  return types[ext] || 'application/octet-stream';
}

/**
 * Start development server with auto-reload
 */
export async function startDevServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const serverInstance = createServer({ ...options, hotReload: true });
  await serverInstance.start();
  
  if (options.hotReload) {
    console.log('📦 Hot reload enabled (watching for changes...)');
    // TODO: Implement file watching in future version
  }
  
  return serverInstance;
}

export const server = {
  create: createServer,
  startDev: startDevServer,
};

