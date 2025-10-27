/**
 * Runtime Router Module
 * Maps page definitions to callable handlers
 */

export interface PageDefinition {
  path: string;
  handler: (...args: any[]) => any | Promise<any>;
  metadata?: Record<string, any>;
}

export interface RouteMatch {
  params: Record<string, string>;
  query: Record<string, string>;
}

class Router {
  private pages: Map<string, PageDefinition> = new Map();

  /**
   * Register a page handler
   */
  registerPage(path: string, handler: (...args: any[]) => any, metadata?: Record<string, any>): void {
    this.pages.set(path, {
      path,
      handler,
      metadata,
    });
  }

  /**
   * Get a page definition by path
   */
  getPage(path: string): PageDefinition | null {
    return this.pages.get(path) || null;
  }

  /**
   * Get all registered pages
   */
  getAllPages(): PageDefinition[] {
    return Array.from(this.pages.values());
  }

  /**
   * Match a path and extract params
   */
  match(requestPath: string): { page: PageDefinition; match: RouteMatch } | null {
    // Exact match first
    const exactMatch = this.pages.get(requestPath);
    if (exactMatch) {
      return {
        page: exactMatch,
        match: { params: {}, query: {} },
      };
    }

    // Try pattern matching (basic implementation)
    for (const [pattern, page] of this.pages.entries()) {
      const match = this.matchPattern(pattern, requestPath);
      if (match) {
        return {
          page,
          match,
        };
      }
    }

    return null;
  }

  /**
   * Execute a page handler by path
   */
  async execute(path: string, ...args: any[]): Promise<any> {
    const match = this.match(path);

    if (!match) {
      throw new Error(`No page found for path: ${path}`);
    }

    const { page, match: routeMatch } = match;
    
    // Pass route match as first argument if handler expects it
    if (page.handler.length > 0) {
      return await page.handler(routeMatch, ...args);
    }

    return await page.handler(...args);
  }

  /**
   * Clear all registered pages
   */
  clear(): void {
    this.pages.clear();
  }

  /**
   * Basic pattern matching for routes like /users/:id
   */
  private matchPattern(pattern: string, path: string): RouteMatch | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Dynamic param
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // No match
        return null;
      }
    }

    return { params, query: {} };
  }
}

// Export singleton instance
export const router = new Router();

// Export for type usage
export type { Router };

