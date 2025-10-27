/**
 * Parser Bridge Layer
 * Connects Chevrotain CST to Pratt expression parser
 */

import { IToken } from 'chevrotain';
import { PrattParser } from './pratt.js';
import { ASTNode } from '../../ast.js';

/**
 * Extract tokens from Chevrotain CST in depth-first, left-to-right order
 * This ensures proper token sequence for the Pratt parser
 */
export function extractTokensFromCst(cstNode: any): IToken[] {
  const tokens: IToken[] = [];
  
  function walk(node: any): void {
    if (!node) return;
    
    // Base case: it's a token (has tokenType property)
    if (node.tokenType && node.image !== undefined) {
      tokens.push(node);
      return;
    }
    
    // It's a CST node with children property
    if (node.children && typeof node.children === 'object') {
      // Sort keys to ensure consistent traversal order
      // Chevrotain uses lexicographical order for rule names
      const keys = Object.keys(node.children).sort();
      
      for (const key of keys) {
        const child = node.children[key];
        if (Array.isArray(child)) {
          child.forEach(item => walk(item));
        } else {
          walk(child);
        }
      }
      return;
    }
    
    // It's an array - process each item
    if (Array.isArray(node)) {
      node.forEach(item => walk(item));
      return;
    }
    
    // If it's a plain object, try to process its values
    if (typeof node === 'object') {
      Object.values(node).forEach(value => walk(value));
    }
  }
  
  walk(cstNode);
  return tokens;
}

/**
 * Parse expression from Chevrotain CST node
 * Main entry point for bridging Chevrotain → Pratt
 */
export function parseExpressionFromCst(cstNode: any): ASTNode {
  // Handle null/undefined
  if (!cstNode) {
    throw new Error('Cannot parse expression from null/undefined CST node');
  }
  
  // If it's already a token array, use directly
  if (Array.isArray(cstNode) && cstNode.length > 0 && cstNode[0].tokenType) {
    const parser = new PrattParser(cstNode);
    return parser.parseExpression();
  }
  
  // Extract tokens from CST
  const tokens = extractTokensFromCst(cstNode);
  
  if (tokens.length === 0) {
    // Debug: log the CST structure
    console.error('Failed to extract tokens from CST node:', JSON.stringify(cstNode, null, 2));
    throw new Error(`No tokens extracted from CST node (type: ${cstNode.name || typeof cstNode})`);
  }
  
  // Parse with Pratt parser
  try {
    const parser = new PrattParser(tokens);
    return parser.parseExpression();
  } catch (error) {
    // Provide better error context
    const tokenImages = tokens.map(t => t.image).join(' ');
    throw new Error(`Pratt parser error for tokens [${tokenImages}]: ${(error as Error).message}`);
  }
}

/**
 * Check if a CST node contains tokens that need Pratt parsing
 * Used for optimization and fallback decisions
 */
export function needsPrattParser(cstNode: any): boolean {
  const tokens = extractTokensFromCst(cstNode);
  
  // Check for operators that indicate complex expressions
  const complexTokens = ['Dot', 'OptionalDot', 'LBracket', 'OptionalBracket', 'LBrace', 'LParen'];
  return tokens.some(token => complexTokens.includes(token.tokenType.name));
}

/**
 * Debug helper: visualize token sequence
 */
export function debugTokenSequence(cstNode: any): string {
  const tokens = extractTokensFromCst(cstNode);
  return tokens.map(t => `${t.tokenType.name}:${t.image}`).join(' → ');
}

