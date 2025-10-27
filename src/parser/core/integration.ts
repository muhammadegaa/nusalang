/**
 * Integration layer between Chevrotain CST and Pratt Parser
 * Bridges the statement-level parser with the Pratt expression parser
 */

import { IToken } from 'chevrotain';
import { PrattParser } from './pratt.js';
import { ASTNode } from '../../ast.js';

/**
 * Parse expression from token stream using Pratt parser
 * This is called from the main parser when we need to parse expressions
 */
export function parseExpressionWithPratt(tokens: IToken[]): ASTNode {
  const parser = new PrattParser(tokens);
  return parser.parseExpression();
}

/**
 * Extract tokens from a CST node for Pratt parsing
 * This handles the conversion from Chevrotain's CST to a flat token stream
 */
export function extractTokensFromCST(cstNode: any): IToken[] {
  const tokens: IToken[] = [];
  
  function extractRecursive(node: any): void {
    if (!node) return;
    
    // If it's a token, add it
    if (node.tokenType) {
      tokens.push(node);
      return;
    }
    
    // If it's a CST node with children, recurse
    if (node.children) {
      for (const key in node.children) {
        const children = node.children[key];
        if (Array.isArray(children)) {
          children.forEach(child => extractRecursive(child));
        } else {
          extractRecursive(children);
        }
      }
    }
    
    // If it's an array, recurse through it
    if (Array.isArray(node)) {
      node.forEach(item => extractRecursive(item));
    }
  }
  
  extractRecursive(cstNode);
  return tokens;
}

/**
 * Check if a CST contains complex expressions that need Pratt parsing
 */
export function needsPrattParsing(children: any): boolean {
  // Check for member access (Dot token)
  if (children.Dot) return true;
  
  // Check for computed access (LBracket after primary expression)
  if (children.LBracket && children.primaryExpression) return true;
  
  // Check for object/array literals
  if (children.LBrace || (children.LBracket && !children.primaryExpression)) return true;
  
  return false;
}

