import { describe, it, expect } from 'vitest';
import { compile, compileToString } from '../compiler.js';

describe('Compiler Integration', () => {
  it('should compile a simple program', async () => {
    const source = `
      fn greet(name) {
        return "Hello";
      }
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('function greet');
  });

  it('should compile imports and functions', async () => {
    const source = `
      import { readFile } from "fs"
      
      fn loadData(path) {
        return readFile(path);
      }
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('import');
    expect(result.code).toContain('function loadData');
  });

  it('should compile async/await', async () => {
    const source = `
      async fn getData() {
        return await fetch("api");
      }
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('async function');
    expect(result.code).toContain('await');
  });

  it('should compile pipeline operators', async () => {
    const source = `
      fn process(input) {
        return input |> transform |> validate;
      }
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    // Nested pipelines
    expect(result.code).toContain('validate');
    expect(result.code).toContain('transform');
  });

  it('should compile variable declarations', async () => {
    const source = `
      let count = 0;
      const name = "Nusa";
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('let count = 0');
    expect(result.code).toContain("const name = 'Nusa'");
  });

  it('should handle compilation errors', async () => {
    const source = 'this is not valid nusalang syntax !!!';
    const result = await compile(source);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('should throw error with compileToString on failure', async () => {
    const source = 'invalid @#$%';
    await expect(compileToString(source)).rejects.toThrow();
  });

  it('should compile complete program', async () => {
    const source = `
      import { findUser } from "database"
      
      @api
      async fn getUser(id) {
        let user = await findUser(id);
        return user;
      }
      
      fn main() {
        const userId = 123;
        return getUser(userId);
      }
    `;
    const result = await compile(source);
    expect(result.success).toBe(true);
    expect(result.code).toContain('import');
    expect(result.code).toContain('async function getUser');
    expect(result.code).toContain('function main');
    expect(result.code).toContain('// @api');
  });
});

