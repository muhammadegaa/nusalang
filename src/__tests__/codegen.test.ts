import { describe, it, expect } from 'vitest';
import { parse } from '../parser.js';
import { generateCode } from '../codegen.js';

describe('Code Generator', () => {
  it('should generate import statements', async () => {
    const ast = await parse('import { test } from "module"');
    const code = await generateCode(ast);
    expect(code).toContain("import { test } from 'module'");
  });

  it('should generate function declarations', async () => {
    const ast = await parse('fn greet(name) { return "Hello"; }');
    const code = await generateCode(ast);
    expect(code).toContain('function greet(name)');
    expect(code).toContain('return');
  });

  it('should generate async functions', async () => {
    const ast = await parse('async fn fetchUser() { return await getUser(); }');
    const code = await generateCode(ast);
    expect(code).toContain('async function fetchUser');
    expect(code).toContain('await');
  });

  it('should generate variable declarations', async () => {
    const ast = await parse('let x = 10; const y = 20;');
    const code = await generateCode(ast);
    expect(code).toContain('let x = 10');
    expect(code).toContain('const y = 20');
  });

  it('should generate binary expressions', async () => {
    const ast = await parse('fn calc() { return 5 + 10; }');
    const code = await generateCode(ast);
    expect(code).toContain('5 + 10');
  });

  it('should preserve annotations as comments', async () => {
    const ast = await parse('@api fn endpoint() { return true; }');
    const code = await generateCode(ast);
    expect(code).toContain('// @api');
    expect(code).toContain('function endpoint');
  });

  it('should generate pipeline expressions', async () => {
    const ast = await parse('fn test() { return input |> process; }');
    const code = await generateCode(ast);
    // Pipeline should be transformed to function call
    expect(code).toContain('process(input)');
  });

  it('should generate pipeline with arguments', async () => {
    const ast = await parse('fn test() { return x |> func(y); }');
    const code = await generateCode(ast);
    // Pipeline should prepend value as first argument
    expect(code).toContain('func(x, y)');
  });

  it('should format code with prettier', async () => {
    const ast = await parse('fn test(){return 42;}');
    const code = await generateCode(ast);
    // Should be nicely formatted
    expect(code).toMatch(/function test\(\)/);
    expect(code).toContain('return 42;');
  });
});

