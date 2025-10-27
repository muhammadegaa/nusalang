/**
 * Expression Parser Bridge
 * Connects Chevrotain CST to Pratt expression parser
 */

import { IToken } from 'chevrotain';
import { PrattParser } from './pratt.js';
import { ASTNode } from '../../ast.js';

/**
 * Parse expression from CST node or token array
 * This is the main entry point for expression parsing
 */
export function parseExpressionPratt(input: any): ASTNode {
  // If input is already a token array, use it directly
  if (Array.isArray(input)) {
    const parser = new PrattParser(input);
    return parser.parseExpression();
  }
  
  // If input is a CST node, extract tokens from it
  const tokens = extractTokensFromCST(input);
  
  if (tokens.length === 0) {
    throw new Error('No tokens found in expression');
  }
  
  const parser = new PrattParser(tokens);
  return parser.parseExpression();
}

/**
 * Extract tokens from CST node in depth-first order
 */
function extractTokensFromCST(cstNode: any): IToken[] {
  const tokens: IToken[] = [];
  
  function extract(node: any): void {
    if (!node) return;
    
    // Base case: it's a token
    if (node.tokenType) {
      tokens.push(node);
      return;
    }
    
    // It's a CST node with children
    if (node.children) {
      // Process children in order
      for (const key in node.children) {
        const children = node.children[key];
        if (Array.isArray(children)) {
          children.forEach(child => extract(child));
        } else {
          extract(children);
        }
      }
      return;
    }
    
    // It's an array
    if (Array.isArray(node)) {
      node.forEach(item => extract(item));
      return;
    }
  }
  
  extract(cstNode);
  return tokens;
}

/**
 * Helper to check if CST contains complex expressions needing Pratt
 */
export function shouldUsePratt(children: any): boolean {
  if (!children) return false;
  
  // Check for member access operators
  if (children.Dot || children.LBracket) return true;
  
  // Check for array/object literals
  if (children.LBrace && !children.Ui) return true; // Not a UI block
  
  // Check for complex nesting
  return false;
}

