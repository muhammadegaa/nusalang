/**
 * Tests for Optional Chaining (Phase 0.7)
 * Tests ?. and ?[] operators
 */

import { describe, it, expect } from 'vitest';
import { compile } from '../compiler.js';
import { execute } from '../runtime/execute.js';

describe('Optional Chaining', () => {
  describe('Optional Member Access (?.)', () => {
    it('should parse optional member access', async () => {
      const input = `
        fn test() {
          let result = user?.name;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('user?.name');
    });

    it('should parse chained optional member access', async () => {
      const input = `
        fn test() {
          let result = user?.profile?.email;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('user?.profile?.email');
    });

    it('should execute optional member with existing property', async () => {
      const input = `
        fn main() {
          let user = { name: "Alice", age: 27 };
          let name = user?.name;
          return name;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('Alice');
    });

    it('should execute optional member with undefined object', async () => {
      const input = `
        fn main() {
          let user = undefined;
          let name = user?.name;
          return name;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(undefined);
    });

    it('should execute deep optional chaining', async () => {
      const input = `
        fn main() {
          let data = { user: { profile: { email: "test@example.com" } } };
          let email = data?.user?.profile?.email;
          return email;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('test@example.com');
    });
  });

  describe('Optional Computed Access (?[])', () => {
    it('should parse optional computed member access', async () => {
      const input = `
        fn test() {
          let result = arr?.[0];
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('arr?.[0]');
    });

    it('should execute optional computed access with existing array', async () => {
      const input = `
        fn main() {
          let arr = [1, 2, 3];
          let first = arr?.[0];
          return first;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(1);
    });

    it('should execute optional computed access with undefined array', async () => {
      const input = `
        fn main() {
          let arr = undefined;
          let first = arr?.[0];
          return first;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(undefined);
    });
  });

  describe('Mixed Optional Chaining', () => {
    it('should mix optional and regular member access', async () => {
      const input = `
        fn test() {
          let result = obj?.prop.nested;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('obj?.prop.nested');
    });

    it('should mix optional member and computed access', async () => {
      const input = `
        fn test() {
          let result = data?.items[0]?.name;
          return result;
        }
      `;
      const result = await compile(input);
      expect(result.success).toBe(true);
      expect(result.code).toContain('data?.items[0]?.name');
    });

    it('should execute mixed chaining with nested structures', async () => {
      const input = `
        fn main() {
          let data = {
            items: [
              { name: "Item 1", price: 100 },
              { name: "Item 2", price: 200 }
            ]
          };
          let firstItemName = data?.items[0]?.name;
          return firstItemName;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe('Item 1');
    });

    it('should handle optional chaining with undefined in middle of chain', async () => {
      const input = `
        fn main() {
          let data = { user: undefined };
          let email = data?.user?.profile?.email;
          return email;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(undefined);
    });
  });

  describe('Optional Chaining with Operators', () => {
    it('should work with pipeline operator', async () => {
      const input = `
        fn getId(x) {
          return x;
        }
        fn main() {
          let user = { id: 42 };
          let result = user?.id |> getId;
          return result;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(42);
    });

    it('should work in binary expressions', async () => {
      const input = `
        fn main() {
          let user = { age: 25 };
          let canVote = user?.age > 18;
          return canVote;
        }
      `;
      const compiled = await compile(input);
      expect(compiled.success).toBe(true);
      
      const execResult = await execute(compiled.code!);
      expect(execResult.success).toBe(true);
      expect(execResult.result).toBe(true);
    });
  });
});

