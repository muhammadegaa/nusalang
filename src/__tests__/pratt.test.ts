import { describe, it, expect } from 'vitest';
import { PrattParser, TokenStream } from '../parser/core/pratt.js';
import { tokenize } from '../lexer.js';

describe('Pratt Parser - Member Expressions', () => {
  it('should parse simple member access (obj.prop)', () => {
    const tokens = tokenize('user.name').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    expect((ast as any).computed).toBe(false);
    expect((ast as any).object.type).toBe('Identifier');
    expect((ast as any).object.name).toBe('user');
    expect((ast as any).property.type).toBe('Identifier');
    expect((ast as any).property.name).toBe('name');
  });

  it('should parse chained member access (obj.prop1.prop2)', () => {
    const tokens = tokenize('user.profile.email').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    const inner = (ast as any).object;
    expect(inner.type).toBe('MemberExpression');
    expect(inner.object.name).toBe('user');
    expect(inner.property.name).toBe('profile');
    expect((ast as any).property.name).toBe('email');
  });

  it('should parse computed member access (arr[0])', () => {
    const tokens = tokenize('items[0]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    expect((ast as any).computed).toBe(true);
    expect((ast as any).object.name).toBe('items');
    expect((ast as any).property.type).toBe('Literal');
    expect((ast as any).property.value).toBe(0);
  });

  it('should parse mixed member access (obj.arr[0].prop)', () => {
    const tokens = tokenize('obj.items[0].name').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    expect((ast as any).property.name).toBe('name');
    
    const middle = (ast as any).object;
    expect(middle.type).toBe('MemberExpression');
    expect(middle.computed).toBe(true);
  });

  it('should parse member access with function calls (obj.method())', () => {
    const tokens = tokenize('user.getName()').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('CallExpression');
    const callee = (ast as any).callee;
    expect(callee.type).toBe('MemberExpression');
    expect(callee.object.name).toBe('user');
    expect(callee.property.name).toBe('getName');
  });
});

describe('Pratt Parser - Array Literals', () => {
  it('should parse empty array', () => {
    const tokens = tokenize('[]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('ArrayExpression');
    expect((ast as any).elements.length).toBe(0);
  });

  it('should parse array with literals', () => {
    const tokens = tokenize('[1, 2, 3]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('ArrayExpression');
    const elements = (ast as any).elements;
    expect(elements.length).toBe(3);
    expect(elements[0].value).toBe(1);
    expect(elements[1].value).toBe(2);
    expect(elements[2].value).toBe(3);
  });

  it('should parse array with mixed types', () => {
    const tokens = tokenize('[1, "hello", true]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    const elements = (ast as any).elements;
    expect(elements[0].value).toBe(1);
    expect(elements[1].value).toBe('hello');
    expect(elements[2].value).toBe(true);
  });

  it('should parse nested arrays', () => {
    const tokens = tokenize('[[1, 2], [3, 4]]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('ArrayExpression');
    const elements = (ast as any).elements;
    expect(elements.length).toBe(2);
    expect(elements[0].type).toBe('ArrayExpression');
    expect(elements[1].type).toBe('ArrayExpression');
  });

  it('should parse array with expressions', () => {
    const tokens = tokenize('[a + b, x * y]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    const elements = (ast as any).elements;
    expect(elements[0].type).toBe('BinaryExpression');
    expect(elements[1].type).toBe('BinaryExpression');
  });
});

describe('Pratt Parser - Object Literals', () => {
  it('should parse empty object', () => {
    const tokens = tokenize('{}').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('ObjectExpression');
    expect((ast as any).properties.length).toBe(0);
  });

  it('should parse object with single property', () => {
    const tokens = tokenize('{ name: "Alice" }').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('ObjectExpression');
    const props = (ast as any).properties;
    expect(props.length).toBe(1);
    expect(props[0].key).toBe('name');
    expect(props[0].value.value).toBe('Alice');
  });

  it('should parse object with multiple properties', () => {
    const tokens = tokenize('{ name: "Alice", age: 27, active: true }').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    const props = (ast as any).properties;
    expect(props.length).toBe(3);
    expect(props[0].key).toBe('name');
    expect(props[1].key).toBe('age');
    expect(props[2].key).toBe('active');
  });

  it('should parse nested objects', () => {
    const tokens = tokenize('{ user: { name: "Alice" } }').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    const props = (ast as any).properties;
    expect(props[0].key).toBe('user');
    expect(props[0].value.type).toBe('ObjectExpression');
  });

  it('should parse object with array values', () => {
    const tokens = tokenize('{ items: [1, 2, 3] }').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    const props = (ast as any).properties;
    expect(props[0].value.type).toBe('ArrayExpression');
    expect(props[0].value.elements.length).toBe(3);
  });
});

describe('Pratt Parser - Complex Expressions', () => {
  it('should parse chained method calls', () => {
    const tokens = tokenize('user.getName().toUpperCase()').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('CallExpression');
    const innerCall = (ast as any).callee;
    expect(innerCall.type).toBe('MemberExpression');
  });

  it('should parse array access on function result', () => {
    const tokens = tokenize('getItems()[0]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    expect((ast as any).computed).toBe(true);
    const object = (ast as any).object;
    expect(object.type).toBe('CallExpression');
  });

  it('should parse property access on array literal', () => {
    const tokens = tokenize('[1, 2, 3][0]').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('MemberExpression');
    expect((ast as any).computed).toBe(true);
    expect((ast as any).object.type).toBe('ArrayExpression');
  });

  it('should handle precedence with binary ops', () => {
    const tokens = tokenize('a.b + c.d').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('BinaryExpression');
    expect((ast as any).operator).toBe('+');
    expect((ast as any).left.type).toBe('MemberExpression');
    expect((ast as any).right.type).toBe('MemberExpression');
  });

  it('should parse await with member expression', () => {
    const tokens = tokenize('await user.fetch()').tokens;
    const parser = new PrattParser(tokens);
    const ast = parser.parseExpression();

    expect(ast.type).toBe('AwaitExpression');
    const argument = (ast as any).argument;
    expect(argument.type).toBe('CallExpression');
    expect(argument.callee.type).toBe('MemberExpression');
  });
});

