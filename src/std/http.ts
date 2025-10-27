/**
 * Standard Library - HTTP Module
 * Provides HTTP utilities for NusaLang applications
 */

export interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Make an HTTP request
 */
export async function request(url: string, options?: Partial<HttpRequest>): Promise<HttpResponse> {
  // Stub implementation - will be enhanced in Phase 0.3
  console.log(`[HTTP Stub] Request to ${url}`, options?.method || 'GET');
  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { message: 'HTTP stub response', url },
  };
}

/**
 * GET request shorthand
 */
export async function get(url: string): Promise<HttpResponse> {
  return request(url, { method: 'GET' });
}

/**
 * POST request shorthand
 */
export async function post(url: string, body: any): Promise<HttpResponse> {
  return request(url, { method: 'POST', body });
}

export const http = {
  request,
  get,
  post,
};

