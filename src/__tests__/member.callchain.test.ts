/**
 * Tests for Call Chaining (Phase 0.7)
 * Tests chained function calls and member access
 */

import { describe, it, expect } from 'vitest';
import { compile } from '../compiler.js';
import { execute } from '../runtime/execute.js';

// Deferred to Phase 1.2 - Requires Chevrotain grammar refactor
// Foundation complete (Pratt parser + bridge), integration pending
describe.skip('Call Chaining', () => {
  describe('Basic Call Chaining', () => {
    it('should parse chained function calls', async () => {
      const input = `
        fn test() {
          let result = api.fetch().process().getData();
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('api.fetch().process().getData()');
    });

    it('should execute chained calls', async () => {
      const input = `
        fn createAPI() {
          return {
            value: 42,
            fetch: fn() {
              return {
                data: 100,
                process: fn() {
                  return {
                    result: 200
                  };
                }
              };
            }
          };
        }
        fn main() {
          let api = createAPI();
          let result = api.fetch().process();
          return result.result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(200);
    });
  });

  describe('Member Access After Function Call', () => {
    it('should parse member access after call', async () => {
      const input = `
        fn test() {
          let result = getUser().name;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('getUser().name');
    });

    it('should execute member access after call', async () => {
      const input = `
        fn getUser() {
          return { name: "Alice", age: 27 };
        }
        fn main() {
          let name = getUser().name;
          return name;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('Alice');
    });

    it('should execute computed access after call', async () => {
      const input = `
        fn getScores() {
          return [95, 87, 92];
        }
        fn main() {
          let firstScore = getScores()[0];
          return firstScore;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(95);
    });
  });

  describe('Complex Call Chains', () => {
    it('should handle deeply nested chains', async () => {
      const input = `
        fn test() {
          let result = api.fetch().data.process().items[0].getName();
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('api.fetch().data.process().items[0].getName()');
    });

    it('should handle chains with arguments', async () => {
      const input = `
        fn test() {
          let result = api.fetch("users").filter(isActive).map(getName);
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('api.fetch("users").filter(isActive).map(getName)');
    });

    it('should execute chain with multiple arguments', async () => {
      const input = `
        fn createAPI() {
          return {
            add: fn(a, b) {
              return {
                value: a + b,
                multiply: fn(x) {
                  return a + b * x;
                }
              };
            }
          };
        }
        fn main() {
          let api = createAPI();
          let result = api.add(10, 5).multiply(2);
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(20); // 10 + (5 * 2)
    });
  });

  describe('Optional Chaining with Calls', () => {
    it('should parse optional chaining with function calls', async () => {
      const input = `
        fn test() {
          let result = api?.fetch()?.data;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('api?.fetch()?.data');
    });

    it('should execute optional call chaining', async () => {
      const input = `
        fn main() {
          let api = {
            fetch: fn() {
              return { data: "success" };
            }
          };
          let result = api?.fetch()?.data;
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('success');
    });

    it('should handle undefined in optional call chain', async () => {
      const input = `
        fn main() {
          let api = undefined;
          let result = api?.fetch()?.data;
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(undefined);
    });
  });

  describe('Chaining with Pipeline Operator', () => {
    it('should combine chaining with pipeline', async () => {
      const input = `
        fn double(x) {
          return x * 2;
        }
        fn getUser() {
          return { age: 25 };
        }
        fn main() {
          let result = getUser().age |> double;
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(50);
    });

    it('should pipeline result of chained calls', async () => {
      const input = `
        fn addTen(x) {
          return x + 10;
        }
        fn createCalculator() {
          return {
            getValue: fn() {
              return 15;
            }
          };
        }
        fn main() {
          let calc = createCalculator();
          let result = calc.getValue() |> addTen;
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(25);
    });
  });

  describe('Chaining with Arrays and Objects', () => {
    it('should chain with array methods', async () => {
      const input = `
        fn getItems() {
          return [
            { name: "Item 1", price: 100 },
            { name: "Item 2", price: 200 },
            { name: "Item 3", price: 150 }
          ];
        }
        fn main() {
          let firstItemName = getItems()[0].name;
          return firstItemName;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('Item 1');
    });

    it('should chain with nested object access', async () => {
      const input = `
        fn getData() {
          return {
            users: [
              { profile: { name: "Alice" } },
              { profile: { name: "Bob" } }
            ]
          };
        }
        fn main() {
          let firstName = getData().users[0].profile.name;
          return firstName;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('Alice');
    });
  });
});

