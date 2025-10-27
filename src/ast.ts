/**
 * AST Node Types for NusaLang
 * Represents the Abstract Syntax Tree structure for parsed NusaLang code
 */

export type ASTNode =
  | ProgramNode
  | ImportDeclarationNode
  | FunctionDeclarationNode
  | VariableDeclarationNode
  | ExpressionStatementNode
  | ReturnStatementNode
  | BlockStatementNode
  | CallExpressionNode
  | IdentifierNode
  | LiteralNode
  | BinaryExpressionNode
  | PipelineExpressionNode
  | AwaitExpressionNode
  | PageDeclarationNode
  | UiBlockNode
  | DataDeclarationNode
  | JSXElementNode
  | JSXTextNode;

export interface BaseNode {
  type: string;
  loc?: SourceLocation;
}

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface ProgramNode extends BaseNode {
  type: 'Program';
  body: ASTNode[];
}

export interface ImportDeclarationNode extends BaseNode {
  type: 'ImportDeclaration';
  specifiers: ImportSpecifier[];
  source: string;
}

export interface ImportSpecifier {
  type: 'ImportSpecifier';
  imported: string;
  local: string;
}

export interface FunctionDeclarationNode extends BaseNode {
  type: 'FunctionDeclaration';
  name: string;
  params: ParameterNode[];
  body: BlockStatementNode;
  async: boolean;
  annotations?: AnnotationNode[];
}

export interface AnnotationNode {
  type: 'Annotation';
  name: string;
  args?: Record<string, any>;
}

export interface ParameterNode {
  type: 'Parameter';
  name: string;
  typeAnnotation?: string;
}

export interface VariableDeclarationNode extends BaseNode {
  type: 'VariableDeclaration';
  kind: 'let' | 'const';
  declarations: VariableDeclaratorNode[];
}

export interface VariableDeclaratorNode {
  type: 'VariableDeclarator';
  id: IdentifierNode;
  init?: ASTNode;
}

export interface ExpressionStatementNode extends BaseNode {
  type: 'ExpressionStatement';
  expression: ASTNode;
}

export interface ReturnStatementNode extends BaseNode {
  type: 'ReturnStatement';
  argument?: ASTNode;
}

export interface BlockStatementNode extends BaseNode {
  type: 'BlockStatement';
  body: ASTNode[];
}

export interface CallExpressionNode extends BaseNode {
  type: 'CallExpression';
  callee: ASTNode;
  arguments: ASTNode[];
}

export interface IdentifierNode extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends BaseNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

export interface BinaryExpressionNode extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface PipelineExpressionNode extends BaseNode {
  type: 'PipelineExpression';
  left: ASTNode;
  right: ASTNode;
}

export interface AwaitExpressionNode extends BaseNode {
  type: 'AwaitExpression';
  argument: ASTNode;
}

export interface PageDeclarationNode extends BaseNode {
  type: 'PageDeclaration';
  path: string;
  body: BlockStatementNode;
  metadata?: Record<string, any>;
}

export interface UiBlockNode extends BaseNode {
  type: 'UiBlock';
  elements: (JSXElementNode | JSXTextNode)[];
}

export interface DataDeclarationNode extends BaseNode {
  type: 'DataDeclaration';
  id: IdentifierNode;
  init: ASTNode;
}

export interface JSXElementNode extends BaseNode {
  type: 'JSXElement';
  tagName: string;
  attributes: JSXAttribute[];
  children: (JSXElementNode | JSXTextNode | ASTNode)[];
  selfClosing: boolean;
}

export interface JSXAttribute {
  name: string;
  value?: string | ASTNode;
}

export interface JSXTextNode extends BaseNode {
  type: 'JSXText';
  value: string;
}

