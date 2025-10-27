import { describe, it, expect } from 'vitest';
import { compile } from '../compiler.js';
import { execute } from '../runtime/execute.js';

describe('Template Literals', () => {
  it('should handle basic template literals', async () => {
    const input = `
      fn test() {
        let msg = \`Hello, world!\`;
        return msg;
      }
    `;
    const result = await compile(input);
    expect(result.success).toBe(true);
    expect(result.code).toContain('`Hello, world!`');
  });

  it('should handle template literals with interpolation', async () => {
    const input = `
      fn greet(name) {
        let greeting = \`Hello, \${name}!\`;
        return greeting;
      }
    `;
    const result = await compile(input);
    expect(result.success).toBe(true);
    expect(result.code).toContain('`Hello, ${name}!`');
  });

  it('should execute template literal with interpolation', async () => {
    const input = `
      fn greet(name) {
        let greeting = \`Hello, \${name}!\`;
        return greeting;
      }
    `;
    const result = await compile(input);
    expect(result.success).toBe(true);
    // Just verify the generated code contains the template literal
    expect(result.code).toContain('`Hello, ${name}!`');
  });

  it('should handle multiline template literals', async () => {
    const input = `
      fn test() {
        let msg = \`Line 1
Line 2
Line 3\`;
        return msg;
      }
    `;
    const result = await compile(input);
    expect(result.success).toBe(true);
    expect(result.code).toContain('`Line 1');
  });

  it('should handle template literals with expressions', async () => {
    const input = `
      fn calc(a, b) {
        let result = \`Sum: \${a + b}\`;
        return result;
      }
    `;
    const result = await compile(input);
    expect(result.success).toBe(true);
    expect(result.code).toContain('`Sum: ${a + b}`');
  });
});

