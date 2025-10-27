import { describe, it, expect } from 'vitest';
import { parse } from '../parser.js';

describe('Parser', () => {
  it('should parse import declarations', async () => {
    const ast = await parse('import { readFile, writeFile } from "fs"');
    expect(ast.type).toBe('Program');
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('ImportDeclaration');
    
    const importNode = ast.body[0] as any;
    expect(importNode.source).toBe('fs');
    expect(importNode.specifiers).toHaveLength(2);
    expect(importNode.specifiers[0].local).toBe('readFile');
  });

  it('should parse function declarations', async () => {
    const ast = await parse('fn add(x, y) { return x + y; }');
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].type).toBe('FunctionDeclaration');
    
    const funcNode = ast.body[0] as any;
    expect(funcNode.name).toBe('add');
    expect(funcNode.params).toHaveLength(2);
    expect(funcNode.params[0].name).toBe('x');
    expect(funcNode.body.type).toBe('BlockStatement');
  });

  it('should parse async functions', async () => {
    const ast = await parse('async fn fetchData() { return await getData(); }');
    const funcNode = ast.body[0] as any;
    expect(funcNode.async).toBe(true);
  });

  it('should parse variable declarations', async () => {
    const ast = await parse('let x = 42; const y = "hello";');
    expect(ast.body).toHaveLength(2);
    
    const letNode = ast.body[0] as any;
    expect(letNode.type).toBe('VariableDeclaration');
    expect(letNode.kind).toBe('let');
    expect(letNode.declarations[0].id.name).toBe('x');
    
    const constNode = ast.body[1] as any;
    expect(constNode.kind).toBe('const');
  });

  it('should parse return statements', async () => {
    const ast = await parse('fn test() { return 123; }');
    const funcNode = ast.body[0] as any;
    const returnStmt = funcNode.body.body[0];
    expect(returnStmt.type).toBe('ReturnStatement');
    expect(returnStmt.argument.type).toBe('Literal');
  });

  it('should parse function calls', async () => {
    // Note: Member expressions like console.log need additional support - testing simple calls
    const ast = await parse('fn test() { myFunc(42); }');
    const funcNode = ast.body[0] as any;
    const exprStmt = funcNode.body.body[0];
    expect(exprStmt.type).toBe('ExpressionStatement');
    expect(exprStmt.expression.type).toBe('CallExpression');
  });

  it('should parse binary expressions', async () => {
    const ast = await parse('fn calc() { return 5 + 3 * 2; }');
    const funcNode = ast.body[0] as any;
    const returnStmt = funcNode.body.body[0];
    expect(returnStmt.type).toBe('ReturnStatement');
    expect(returnStmt.argument.type).toBe('BinaryExpression');
  });

  it('should parse annotations', async () => {
    const ast = await parse('@api fn handler() { return true; }');
    const funcNode = ast.body[0] as any;
    expect(funcNode.annotations).toBeDefined();
    expect(funcNode.annotations[0].name).toBe('api');
  });
});

