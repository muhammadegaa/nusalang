/**
 * Pratt Parser for NusaLang Expressions
 * Handles operator precedence and complex expressions
 */

import { IToken } from 'chevrotain';
import { ASTNode } from '../../ast.js';

/**
 * Operator precedence levels (higher = tighter binding)
 */
export enum Precedence {
  LOWEST = 1,
  PIPELINE = 2,        // |>
  LOGICAL_OR = 3,      // ||
  LOGICAL_AND = 4,     // &&
  EQUALITY = 5,        // ==, !=
  COMPARISON = 6,      // <, >, <=, >=
  ADDITION = 7,        // +, -
  MULTIPLICATION = 8,  // *, /
  UNARY = 9,           // !, -
  CALL = 10,           // function()
  MEMBER = 11,         // obj.prop, arr[idx]
}

/**
 * Get precedence for binary operators
 */
export function getPrecedence(tokenType: string): Precedence {
  switch (tokenType) {
    case 'Pipeline':
      return Precedence.PIPELINE;
    case 'Plus':
    case 'Minus':
      return Precedence.ADDITION;
    case 'Multiply':
    case 'Divide':
      return Precedence.MULTIPLICATION;
    case 'GreaterThan':
    case 'LessThan':
      return Precedence.COMPARISON;
    case 'Dot':
    case 'LBracket':  // Computed member access
    case 'LParen':    // Call expression
      return Precedence.MEMBER;
    default:
      return Precedence.LOWEST;
  }
}

/**
 * Token stream wrapper for Pratt parser
 */
export class TokenStream {
  private position = 0;
  private tokens: IToken[];

  constructor(tokens: IToken[]) {
    this.tokens = tokens;
  }

  current(): IToken | null {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  peek(offset = 1): IToken | null {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : null;
  }

  advance(): IToken | null {
    const token = this.current();
    this.position++;
    return token;
  }

  expect(tokenType: string): IToken {
    const token = this.current();
    if (!token || token.tokenType.name !== tokenType) {
      throw new Error(`Expected ${tokenType}, got ${token?.tokenType.name || 'EOF'}`);
    }
    return this.advance()!;
  }

  match(tokenType: string): boolean {
    const token = this.current();
    return token !== null && token.tokenType.name === tokenType;
  }

  matchAny(...tokenTypes: string[]): boolean {
    const token = this.current();
    if (!token) return false;
    return tokenTypes.includes(token.tokenType.name);
  }

  getPosition(): number {
    return this.position;
  }

  setPosition(pos: number): void {
    this.position = pos;
  }
}

/**
 * Pratt Parser implementation
 */
export class PrattParser {
  private stream: TokenStream;

  constructor(tokens: IToken[]) {
    this.stream = new TokenStream(tokens);
  }

  /**
   * Parse an expression with given precedence
   */
  parseExpression(precedence: Precedence = Precedence.LOWEST): ASTNode {
    // Get prefix parser
    let left = this.parsePrefix();

    // Handle infix operators and postfix operations
    while (this.shouldContinue(precedence)) {
      const token = this.stream.current();
      if (!token) break;
      
      const tokenType = token.tokenType.name;
      
      // Check for postfix operations (member access, call)
      if (tokenType === 'Dot' || tokenType === 'LBracket' || tokenType === 'LParen') {
        left = this.parseInfix(left);
      } else {
        left = this.parseInfix(left);
      }
    }

    return left;
  }

  /**
   * Check if we should continue parsing at this precedence level
   */
  private shouldContinue(precedence: Precedence): boolean {
    const token = this.stream.current();
    if (!token) return false;

    const tokenPrecedence = getPrecedence(token.tokenType.name);
    return tokenPrecedence > precedence;
  }

  /**
   * Parse prefix expression (literals, identifiers, calls, await, etc.)
   */
  private parsePrefix(): ASTNode {
    const token = this.stream.current();
    
    if (!token) {
      throw new Error('Unexpected end of input');
    }

    const tokenType = token.tokenType.name;

    // Await expression
    if (tokenType === 'Await') {
      return this.parseAwaitExpression();
    }

    // Parenthesized expression
    if (tokenType === 'LParen') {
      return this.parseGroupedExpression();
    }

    // Array literal
    if (tokenType === 'LBracket') {
      return this.parseArrayLiteral();
    }

    // Object literal
    if (tokenType === 'LBrace') {
      return this.parseObjectLiteral();
    }

    // Literals
    if (this.stream.matchAny('TemplateLiteral', 'StringLiteral', 'NumberLiteral', 'BooleanLiteral')) {
      return this.parseLiteral();
    }

    // Identifier or call expression
    if (tokenType === 'Identifier') {
      return this.parseIdentifierOrCall();
    }

    throw new Error(`Unexpected token: ${tokenType}`);
  }

  /**
   * Parse infix expression (binary ops, member access, etc.)
   */
  private parseInfix(left: ASTNode): ASTNode {
    const token = this.stream.current();
    
    if (!token) {
      return left;
    }

    const tokenType = token.tokenType.name;

    // Member access: obj.prop
    if (tokenType === 'Dot') {
      return this.parseMemberExpression(left);
    }

    // Computed member: arr[index]
    if (tokenType === 'LBracket') {
      return this.parseComputedMemberExpression(left);
    }

    // Call expression: func()
    if (tokenType === 'LParen') {
      return this.parseCallExpression(left);
    }

    // Binary operators
    if (this.stream.matchAny('Plus', 'Minus', 'Multiply', 'Divide', 'GreaterThan', 'LessThan', 'Pipeline')) {
      return this.parseBinaryExpression(left);
    }

    return left;
  }

  /**
   * Parse await expression
   */
  private parseAwaitExpression(): ASTNode {
    this.stream.expect('Await');
    const argument = this.parseExpression(Precedence.UNARY);
    
    return {
      type: 'AwaitExpression',
      argument,
    };
  }

  /**
   * Parse grouped (parenthesized) expression
   */
  private parseGroupedExpression(): ASTNode {
    this.stream.expect('LParen');
    const expr = this.parseExpression();
    this.stream.expect('RParen');
    return expr;
  }

  /**
   * Parse array literal
   */
  private parseArrayLiteral(): ASTNode {
    this.stream.expect('LBracket');
    const elements: ASTNode[] = [];

    if (!this.stream.match('RBracket')) {
      elements.push(this.parseExpression());
      
      while (this.stream.match('Comma')) {
        this.stream.advance();
        if (this.stream.match('RBracket')) break; // Trailing comma
        elements.push(this.parseExpression());
      }
    }

    this.stream.expect('RBracket');

    return {
      type: 'ArrayExpression',
      elements,
    };
  }

  /**
   * Parse object literal
   */
  private parseObjectLiteral(): ASTNode {
    this.stream.expect('LBrace');
    const properties: { key: string; value: ASTNode }[] = [];

    if (!this.stream.match('RBrace')) {
      properties.push(this.parseObjectProperty());
      
      while (this.stream.match('Comma')) {
        this.stream.advance();
        if (this.stream.match('RBrace')) break; // Trailing comma
        properties.push(this.parseObjectProperty());
      }
    }

    this.stream.expect('RBrace');

    return {
      type: 'ObjectExpression',
      properties,
    };
  }

  /**
   * Parse object property
   */
  private parseObjectProperty(): { key: string; value: ASTNode } {
    const keyToken = this.stream.expect('Identifier');
    this.stream.expect('Colon');
    const value = this.parseExpression();

    return {
      key: keyToken.image,
      value,
    };
  }

  /**
   * Parse literal
   */
  private parseLiteral(): ASTNode {
    const token = this.stream.advance()!;
    const tokenType = token.tokenType.name;

    if (tokenType === 'TemplateLiteral') {
      return {
        type: 'Literal',
        value: token.image,
        raw: token.image,
      };
    }

    if (tokenType === 'StringLiteral') {
      return {
        type: 'Literal',
        value: token.image.slice(1, -1),
        raw: token.image,
      };
    }

    if (tokenType === 'NumberLiteral') {
      return {
        type: 'Literal',
        value: parseFloat(token.image),
        raw: token.image,
      };
    }

    if (tokenType === 'BooleanLiteral') {
      return {
        type: 'Literal',
        value: token.image === 'true',
        raw: token.image,
      };
    }

    throw new Error(`Unknown literal type: ${tokenType}`);
  }

  /**
   * Parse identifier or call expression
   */
  private parseIdentifierOrCall(): ASTNode {
    const nameToken = this.stream.expect('Identifier');
    
    // Check for call expression
    if (this.stream.match('LParen')) {
      const callee: ASTNode = {
        type: 'Identifier',
        name: nameToken.image,
      };
      return this.parseCallExpression(callee);
    }

    return {
      type: 'Identifier',
      name: nameToken.image,
    };
  }

  /**
   * Parse member expression: obj.prop
   */
  private parseMemberExpression(object: ASTNode): ASTNode {
    this.stream.expect('Dot');
    const propertyToken = this.stream.expect('Identifier');

    const member: ASTNode = {
      type: 'MemberExpression',
      object,
      property: {
        type: 'Identifier',
        name: propertyToken.image,
      },
      computed: false,
    };

    // Check for chaining
    if (this.stream.match('Dot') || this.stream.match('LBracket') || this.stream.match('LParen')) {
      return this.parseInfix(member);
    }

    return member;
  }

  /**
   * Parse computed member expression: arr[index]
   */
  private parseComputedMemberExpression(object: ASTNode): ASTNode {
    this.stream.expect('LBracket');
    const property = this.parseExpression();
    this.stream.expect('RBracket');

    const member: ASTNode = {
      type: 'MemberExpression',
      object,
      property,
      computed: true,
    };

    // Check for chaining
    if (this.stream.match('Dot') || this.stream.match('LBracket') || this.stream.match('LParen')) {
      return this.parseInfix(member);
    }

    return member;
  }

  /**
   * Parse call expression: func(args)
   */
  private parseCallExpression(callee: ASTNode): ASTNode {
    this.stream.expect('LParen');
    const args: ASTNode[] = [];

    if (!this.stream.match('RParen')) {
      args.push(this.parseExpression());
      
      while (this.stream.match('Comma')) {
        this.stream.advance();
        if (this.stream.match('RParen')) break; // Trailing comma
        args.push(this.parseExpression());
      }
    }

    this.stream.expect('RParen');

    const call: ASTNode = {
      type: 'CallExpression',
      callee,
      arguments: args,
    };

    // Check for chaining: func().prop or func()[0] or func()()
    if (this.stream.match('Dot') || this.stream.match('LBracket') || this.stream.match('LParen')) {
      return this.parseInfix(call);
    }

    return call;
  }

  /**
   * Parse binary expression
   */
  private parseBinaryExpression(left: ASTNode): ASTNode {
    const operatorToken = this.stream.advance()!;
    const precedence = getPrecedence(operatorToken.tokenType.name);
    const right = this.parseExpression(precedence);

    // Special handling for pipeline
    if (operatorToken.tokenType.name === 'Pipeline') {
      return {
        type: 'PipelineExpression',
        left,
        right,
      };
    }

    return {
      type: 'BinaryExpression',
      operator: operatorToken.image,
      left,
      right,
    };
  }
}

