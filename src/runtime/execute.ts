/**
 * Runtime Execution Module
 * Executes compiled NusaLang JavaScript in a sandboxed context
 */

import * as vm from 'vm';
import { db } from './db.js';
import { router } from './router.js';
import { signal, effect, computed, batch, untrack } from './reactivity.js';
import { subscribe, publish, closeConnection, closeAllConnections, isConnected } from './websocket.js';

export interface ExecutionContext {
  [key: string]: any;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  exports?: Record<string, any>;
}

export interface ExecutionOptions {
  timeout?: number;
  context?: ExecutionContext;
  enableRouter?: boolean;
  enableDb?: boolean;
  config?: Record<string, any>;
}

/**
 * Execute compiled JavaScript code in a sandboxed context
 */
export async function execute(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const {
    timeout = 5000,
    context = {},
    enableRouter = true,
    enableDb = true,
    config,
  } = options;

  try {
    // Create sandbox context with runtime modules
    const sandbox: ExecutionContext = {
      console,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      ...context,
    };

    // Add runtime modules if enabled
    if (enableDb) {
      sandbox.db = db;
    }

    if (enableRouter) {
      sandbox.router = router;
      sandbox.page = router.registerPage.bind(router);
    }

    // Expose config if provided
    if (config) {
      sandbox.config = config;
    }

    // Add reactive runtime
    sandbox.signal = signal;
    sandbox.effect = effect;
    sandbox.computed = computed;
    sandbox.batch = batch;
    sandbox.untrack = untrack;

    // Add WebSocket runtime
    sandbox.subscribe = subscribe;
    sandbox.publish = publish;
    sandbox.closeConnection = closeConnection;
    sandbox.closeAllConnections = closeAllConnections;
    sandbox.isConnected = isConnected;

    // Track exports
    const exports: Record<string, any> = {};
    sandbox.exports = exports;

    // Create VM context
    const vmContext = vm.createContext(sandbox);

    // Wrap code in async IIFE only if it contains top-level await/data
    const needsAsyncWrapper = code.includes('const') && code.includes('await');
    
    const wrappedCode = needsAsyncWrapper
      ? `(async () => { ${code} })()`
      : code;

    // Execute code with timeout
    const script = new vm.Script(wrappedCode, {
      filename: 'nusa-runtime.js',
    });

    const result = await script.runInContext(vmContext, {
      displayErrors: true,
      timeout,
    });

    return {
      success: true,
      result,
      exports,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    };
  }
}

/**
 * Execute a NusaLang function by name
 */
export async function executeFunction(
  code: string,
  functionName: string,
  args: any[] = [],
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const executionResult = await execute(code, options);

  if (!executionResult.success) {
    return executionResult;
  }

  try {
    // Get the function from the context
    const sandbox = executionResult.exports || {};
    const fn = sandbox[functionName];

    if (typeof fn !== 'function') {
      throw new Error(`Function '${functionName}' not found or not a function`);
    }

    // Execute the function
    const result = await fn(...args);

    return {
      success: true,
      result,
      exports: executionResult.exports,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    };
  }
}

/**
 * Execute with module-like exports
 */
export async function executeModule(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  // Wrap code to capture exports
  const wrappedCode = `
    const module = { exports: {} };
    const exports = module.exports;
    
    ${code}
    
    // Export all functions
    module.exports;
  `;

  return execute(wrappedCode, options);
}

