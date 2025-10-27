import { describe, it, expect } from 'vitest';
import { tokenize } from '../lexer.js';

describe('Lexer', () => {
  it('should tokenize keywords', () => {
    const result = tokenize('fn let const import from return async await');
    expect(result.tokens).toHaveLength(8);
    expect(result.tokens[0].tokenType.name).toBe('Fn');
    expect(result.tokens[1].tokenType.name).toBe('Let');
    expect(result.tokens[2].tokenType.name).toBe('Const');
  });

  it('should tokenize identifiers', () => {
    const result = tokenize('myFunction myVariable');
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].tokenType.name).toBe('Identifier');
    expect(result.tokens[0].image).toBe('myFunction');
  });

  it('should tokenize string literals', () => {
    const result = tokenize('"hello world"');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].tokenType.name).toBe('StringLiteral');
    expect(result.tokens[0].image).toBe('"hello world"');
  });

  it('should tokenize number literals', () => {
    const result = tokenize('42 3.14');
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].tokenType.name).toBe('NumberLiteral');
    expect(result.tokens[0].image).toBe('42');
  });

  it('should tokenize operators', () => {
    const result = tokenize('|> + - * / = > <');
    expect(result.tokens[0].tokenType.name).toBe('Pipeline');
    expect(result.tokens[1].tokenType.name).toBe('Plus');
    expect(result.tokens[2].tokenType.name).toBe('Minus');
  });

  it('should skip whitespace and comments', () => {
    const result = tokenize('fn // comment\nmyFunc');
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].tokenType.name).toBe('Fn');
    expect(result.tokens[1].tokenType.name).toBe('Identifier');
  });

  it('should tokenize delimiters', () => {
    const result = tokenize('( ) { } , ; : @');
    expect(result.tokens).toHaveLength(8);
    expect(result.tokens[0].tokenType.name).toBe('LParen');
    expect(result.tokens[1].tokenType.name).toBe('RParen');
    expect(result.tokens[2].tokenType.name).toBe('LBrace');
  });
});

