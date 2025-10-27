/**
 * UI Renderer for NusaLang
 * Converts UI AST nodes to HTML strings
 */

import {
  UiBlockNode,
  JSXElementNode,
  JSXTextNode,
  ASTNode,
  IdentifierNode,
  LiteralNode,
  CallExpressionNode,
  BinaryExpressionNode,
} from '../ast.js';

export interface RenderOptions {
  pretty?: boolean;
  indent?: string;
}

/**
 * Render a UI block to HTML string
 */
export function renderUiBlock(node: UiBlockNode, options: RenderOptions = {}): string {
  const { pretty = true, indent = '  ' } = options;
  
  const html = node.elements.map(element => renderElement(element, 0, indent)).join('\n');
  
  return pretty ? html : html.replace(/\n\s*/g, '');
}

/**
 * Render a single UI element (JSX or text)
 */
function renderElement(
  node: JSXElementNode | JSXTextNode | ASTNode,
  depth: number,
  indent: string
): string {
  if (node.type === 'JSXText') {
    return renderJSXText(node as JSXTextNode, depth, indent);
  }
  
  if (node.type === 'JSXElement') {
    return renderJSXElement(node as JSXElementNode, depth, indent);
  }
  
  // Handle expression nodes (for interpolation)
  return renderExpression(node, depth, indent);
}

/**
 * Render JSX text node
 */
function renderJSXText(node: JSXTextNode, depth: number, indent: string): string {
  const padding = indent.repeat(depth);
  const trimmed = node.value.trim();
  
  if (!trimmed) return '';
  
  return `${padding}${trimmed}`;
}

/**
 * Render JSX element node
 */
function renderJSXElement(node: JSXElementNode, depth: number, indent: string): string {
  const padding = indent.repeat(depth);
  const tagName = node.tagName;
  
  // Render attributes
  const attrs = node.attributes
    .map(attr => {
      if (typeof attr.value === 'string') {
        return `${attr.name}="${attr.value}"`;
      }
      if (attr.value) {
        // Expression attribute - evaluate at runtime
        return `${attr.name}="{${renderExpression(attr.value, 0, '')}}"`;
      }
      return attr.name; // Boolean attribute
    })
    .join(' ');
  
  const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
  
  // Self-closing tags
  if (node.selfClosing || node.children.length === 0) {
    return `${padding}${openTag.replace('>', ' />')}`;
  }
  
  // Render children
  const children = node.children
    .map(child => renderElement(child, depth + 1, indent))
    .filter(c => c.trim())
    .join('\n');
  
  if (!children) {
    return `${padding}${openTag}</${tagName}>`;
  }
  
  return `${padding}${openTag}\n${children}\n${padding}</${tagName}>`;
}

/**
 * Render an expression node to a placeholder or value
 */
function renderExpression(node: ASTNode, depth: number, indent: string): string {
  switch (node.type) {
    case 'Identifier':
      return (node as IdentifierNode).name;
    
    case 'Literal':
      const lit = node as LiteralNode;
      return String(lit.value);
    
    case 'CallExpression':
      const call = node as CallExpressionNode;
      const callee = renderExpression(call.callee, depth, indent);
      const args = call.arguments.map(arg => renderExpression(arg, depth, indent)).join(', ');
      return `${callee}(${args})`;
    
    case 'BinaryExpression':
      const bin = node as BinaryExpressionNode;
      const left = renderExpression(bin.left, depth, indent);
      const right = renderExpression(bin.right, depth, indent);
      return `${left} ${bin.operator} ${right}`;
    
    default:
      return `{${node.type}}`;
  }
}

/**
 * Helper to create JSX element node
 */
export function createElement(
  tagName: string,
  attributes: Record<string, string | ASTNode> = {},
  ...children: (JSXElementNode | JSXTextNode | ASTNode)[]
): JSXElementNode {
  return {
    type: 'JSXElement',
    tagName,
    attributes: Object.entries(attributes).map(([name, value]) => ({
      name,
      value: typeof value === 'string' ? value : value,
    })),
    children,
    selfClosing: children.length === 0,
  };
}

/**
 * Helper to create JSX text node
 */
export function createText(value: string): JSXTextNode {
  return {
    type: 'JSXText',
    value,
  };
}

/**
 * Render a complete page with UI block
 */
export function renderPage(
  path: string,
  uiBlock: UiBlockNode,
  options: RenderOptions = {}
): string {
  const bodyContent = renderUiBlock(uiBlock, options);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NusaLang - ${path}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

export const ui = {
  render: renderUiBlock,
  renderPage,
  createElement,
  createText,
};

