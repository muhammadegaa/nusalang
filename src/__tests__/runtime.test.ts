import { describe, it, expect, beforeEach } from 'vitest';
import { execute, executeFunction } from '../runtime/execute.js';
import { db } from '../runtime/db.js';
import { router } from '../runtime/router.js';

describe('Runtime Execution', () => {
  beforeEach(() => {
    db.clearAll();
    router.clear();
  });

  it('should execute simple JavaScript code', async () => {
    const code = `
      const result = 5 + 10;
      result;
    `;
    const result = await execute(code);
    expect(result.success).toBe(true);
    expect(result.result).toBe(15);
  });

  it('should execute async code', async () => {
    const code = `
      async function getData() {
        return Promise.resolve(42);
      }
      getData();
    `;
    const result = await execute(code);
    expect(result.success).toBe(true);
    expect(result.result).toBe(42);
  });

  it('should provide console access', async () => {
    const logs: any[] = [];
    const code = `
      console.log('test message');
      'done';
    `;
    
    const customConsole = {
      log: (...args: any[]) => logs.push(args),
    };
    
    const result = await execute(code, {
      context: { console: customConsole },
    });
    
    expect(result.success).toBe(true);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(['test message']);
  });

  it('should handle execution errors', async () => {
    const code = `
      throw new Error('Test error');
    `;
    const result = await execute(code);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Test error');
  });

  it('should execute with timeout', async () => {
    const code = `
      while(true) {}
    `;
    const result = await execute(code, { timeout: 100 });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should provide db module when enabled', async () => {
    const code = `
      db.table('users').insert({ name: 'Alice' });
      db.table('users').all();
    `;
    const result = await execute(code, { enableDb: true });
    expect(result.success).toBe(true);
  });

  it('should provide router module when enabled', async () => {
    const code = `
      page('/test', () => 'test page');
      router.getPage('/test');
    `;
    const result = await execute(code, { enableRouter: true });
    expect(result.success).toBe(true);
  });
});

describe('Execute Function', () => {
  it('should execute a specific function by name', async () => {
    const code = `
      function add(a, b) {
        return a + b;
      }
      exports.add = add;
    `;
    const result = await executeFunction(code, 'add', [5, 3]);
    expect(result.success).toBe(true);
    expect(result.result).toBe(8);
  });

  it('should handle function not found', async () => {
    const code = `
      function test() { return 42; }
    `;
    const result = await executeFunction(code, 'nonexistent');
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('not found');
  });
});

