/**
 * Parser for NusaLang
 * Converts tokens into an Abstract Syntax Tree using Chevrotain
 */

import { CstParser, IToken } from 'chevrotain';
import * as tokens from './lexer.js';
import {
  ASTNode,
  ProgramNode,
  ImportDeclarationNode,
  FunctionDeclarationNode,
  VariableDeclarationNode,
  ExpressionStatementNode,
  ReturnStatementNode,
  BlockStatementNode,
  IdentifierNode,
  LiteralNode,
  ParameterNode,
  AnnotationNode,
  ImportSpecifier,
  PageDeclarationNode,
  DataDeclarationNode,
} from './ast.js';
import { parseExpressionFromCst } from './parser/core/bridge.js';

class NusaParser extends CstParser {
  constructor() {
    super(tokens.allTokens, {
      recoveryEnabled: true,
      nodeLocationTracking: 'full',
    });

    this.performSelfAnalysis();
  }

  // Program: top-level statements
  public program = this.RULE('program', () => {
    const statements: any[] = [];
    this.MANY(() => {
      statements.push(this.SUBRULE(this.statement));
    });
    return statements;
  });

  // Statement: can be import, function, variable declaration, page, data, or expression
  private statement = this.RULE('statement', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.importDeclaration) },
      { ALT: () => this.SUBRULE(this.pageDeclaration) },
      { ALT: () => this.SUBRULE(this.dataDeclaration) },
      { ALT: () => this.SUBRULE(this.functionDeclaration) },
      { ALT: () => this.SUBRULE(this.variableDeclaration) },
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.expressionStatement) },
    ]);
  });

  // Import: import { x, y } from "module"
  private importDeclaration = this.RULE('importDeclaration', () => {
    this.CONSUME(tokens.Import);
    this.CONSUME(tokens.LBrace);
    const specifiers: any[] = [];
    specifiers.push(this.SUBRULE(this.importSpecifier));
    this.MANY(() => {
      this.CONSUME(tokens.Comma);
      specifiers.push(this.SUBRULE2(this.importSpecifier));
    });
    this.CONSUME(tokens.RBrace);
    this.CONSUME(tokens.From);
    const source = this.CONSUME(tokens.StringLiteral);
    this.OPTION(() => this.CONSUME(tokens.Semicolon));
    return { specifiers, source };
  });

  private importSpecifier = this.RULE('importSpecifier', () => {
    const name = this.CONSUME(tokens.Identifier);
    return { name };
  });

  // Page: page "path" { body }
  private pageDeclaration = this.RULE('pageDeclaration', () => {
    this.CONSUME(tokens.Page);
    const path = this.CONSUME(tokens.StringLiteral);
    const body = this.SUBRULE(this.blockStatement);
    return { path, body };
  });

  // Data: data varName = expression
  private dataDeclaration = this.RULE('dataDeclaration', () => {
    this.CONSUME(tokens.Data);
    const id = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Equals);
    const init = this.SUBRULE(this.expression);
    this.OPTION(() => this.CONSUME(tokens.Semicolon));
    return { id, init };
  });

  // Function: [annotations] [async] fn name(params) { body }
  private functionDeclaration = this.RULE('functionDeclaration', () => {
    const annotations: any[] = [];
    this.MANY(() => {
      annotations.push(this.SUBRULE(this.annotation));
    });

    const isAsync = this.OPTION(() => this.CONSUME(tokens.Async));

    this.CONSUME(tokens.Fn);
    const name = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LParen);
    const params: any[] = [];
    this.OPTION2(() => {
      params.push(this.SUBRULE(this.parameter));
      this.MANY2(() => {
        this.CONSUME(tokens.Comma);
        params.push(this.SUBRULE2(this.parameter));
      });
    });
    this.CONSUME(tokens.RParen);
    const body = this.SUBRULE(this.blockStatement);
    return { annotations, isAsync, name, params, body };
  });

  private annotation = this.RULE('annotation', () => {
    this.CONSUME(tokens.At);
    const name = this.CONSUME(tokens.Identifier);
    
    // Optional arguments for annotations like @route("/path")
    const args: any[] = [];
    this.OPTION(() => {
      this.CONSUME(tokens.LParen);
      this.OPTION2(() => {
        args.push(this.SUBRULE(this.annotationArgument));
        this.MANY(() => {
          this.CONSUME(tokens.Comma);
          args.push(this.SUBRULE2(this.annotationArgument));
        });
      });
      this.CONSUME(tokens.RParen);
    });
    
    return { name, args };
  });

  private annotationArgument = this.RULE('annotationArgument', () => {
    return this.OR([
      { ALT: () => this.CONSUME(tokens.StringLiteral) },
      { ALT: () => this.CONSUME(tokens.NumberLiteral) },
      { ALT: () => this.CONSUME(tokens.Identifier) },
    ]);
  });

  private parameter = this.RULE('parameter', () => {
    const name = this.CONSUME(tokens.Identifier);
    let typeAnnotation = null;
    this.OPTION(() => {
      this.CONSUME(tokens.Colon);
      typeAnnotation = this.CONSUME2(tokens.Identifier);
    });
    return { name, typeAnnotation };
  });

  // Variable: let x = value; | const y = value;
  private variableDeclaration = this.RULE('variableDeclaration', () => {
    const kind = this.OR([
      { ALT: () => this.CONSUME(tokens.Let) },
      { ALT: () => this.CONSUME(tokens.Const) },
    ]);
    const id = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Equals);
    const init = this.SUBRULE(this.expression);
    this.OPTION(() => this.CONSUME(tokens.Semicolon));
    return { kind, id, init };
  });

  // Return: return [expression];
  private returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(tokens.Return);
    const argument = this.OPTION(() => this.SUBRULE(this.expression));
    this.OPTION2(() => this.CONSUME(tokens.Semicolon));
    return { argument };
  });

  // Expression statement
  private expressionStatement = this.RULE('expressionStatement', () => {
    const expression = this.SUBRULE(this.expression);
    this.OPTION(() => this.CONSUME(tokens.Semicolon));
    return { expression };
  });

  // Block: { statements }
  private blockStatement = this.RULE('blockStatement', () => {
    this.CONSUME(tokens.LBrace);
    const body: any[] = [];
    this.MANY(() => {
      body.push(this.SUBRULE(this.statement));
    });
    this.CONSUME(tokens.RBrace);
    return { body };
  });

  // Expression: handles pipelines, binary ops, await, calls
  private expression = this.RULE('expression', () => {
    return this.SUBRULE(this.pipelineExpression);
  });

  private pipelineExpression = this.RULE('pipelineExpression', () => {
    let left = this.SUBRULE(this.binaryExpression);
    this.MANY(() => {
      this.CONSUME(tokens.Pipeline);
      const right = this.SUBRULE2(this.binaryExpression);
      left = { type: 'pipeline', left, right } as any;
    });
    return left;
  });

  private binaryExpression = this.RULE('binaryExpression', () => {
    let left = this.SUBRULE(this.primaryExpression);
    this.MANY(() => {
      const operator = this.OR([
        { ALT: () => this.CONSUME(tokens.Plus) },
        { ALT: () => this.CONSUME(tokens.Minus) },
        { ALT: () => this.CONSUME(tokens.Multiply) },
        { ALT: () => this.CONSUME(tokens.Divide) },
        { ALT: () => this.CONSUME(tokens.GreaterThan) },
        { ALT: () => this.CONSUME(tokens.LessThan) },
      ]);
      const right = this.SUBRULE2(this.primaryExpression);
      left = { type: 'binary', operator, left, right } as any;
    });
    return left;
  });

  private primaryExpression = this.RULE('primaryExpression', () => {
    return this.OR([
      { ALT: () => this.SUBRULE(this.awaitExpression) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
      { ALT: () => this.SUBRULE(this.callExpression) },
      { ALT: () => this.SUBRULE(this.literal) },
      { ALT: () => this.SUBRULE(this.identifier) },
      { ALT: () => this.SUBRULE(this.parenthesizedExpression) },
    ]);
  });

  private awaitExpression = this.RULE('awaitExpression', () => {
    this.CONSUME(tokens.Await);
    const argument = this.SUBRULE(this.primaryExpression);
    return { type: 'await', argument };
  });

  private callExpression = this.RULE('callExpression', () => {
    const callee = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.LParen);
    const args: any[] = [];
    this.OPTION(() => {
      args.push(this.SUBRULE(this.expression));
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        args.push(this.SUBRULE2(this.expression));
      });
    });
    this.CONSUME(tokens.RParen);
    return { type: 'call', callee, args };
  });

  private parenthesizedExpression = this.RULE('parenthesizedExpression', () => {
    this.CONSUME(tokens.LParen);
    const expr = this.SUBRULE(this.expression);
    this.CONSUME(tokens.RParen);
    return expr;
  });

  private literal = this.RULE('literal', () => {
    return this.OR([
      { ALT: () => this.CONSUME(tokens.TemplateLiteral) },
      { ALT: () => this.CONSUME(tokens.StringLiteral) },
      { ALT: () => this.CONSUME(tokens.NumberLiteral) },
      { ALT: () => this.CONSUME(tokens.BooleanLiteral) },
    ]);
  });

  private identifier = this.RULE('identifier', () => {
    return this.CONSUME(tokens.Identifier);
  });

  // Array literal: [expr, expr, ...]
  private arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(tokens.LBracket);
    const elements: any[] = [];
    this.OPTION(() => {
      elements.push(this.SUBRULE(this.expression));
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.OPTION2(() => elements.push(this.SUBRULE2(this.expression)));
      });
    });
    this.CONSUME(tokens.RBracket);
    return { elements };
  });

  // Object literal: {key: expr, key: expr, ...}
  private objectLiteral = this.RULE('objectLiteral', () => {
    this.CONSUME(tokens.LBrace);
    const properties: any[] = [];
    this.OPTION(() => {
      properties.push(this.SUBRULE(this.objectProperty));
      this.MANY(() => {
        this.CONSUME(tokens.Comma);
        this.OPTION2(() => properties.push(this.SUBRULE2(this.objectProperty)));
      });
    });
    this.CONSUME(tokens.RBrace);
    return { properties };
  });

  private objectProperty = this.RULE('objectProperty', () => {
    const key = this.CONSUME(tokens.Identifier);
    this.CONSUME(tokens.Colon);
    const value = this.SUBRULE(this.expression);
    return { key, value };
  });
}

export const parserInstance = new NusaParser();

/**
 * Convert CST to AST
 */
export function cstToAst(cst: any): ProgramNode {
  const statements: ASTNode[] = [];

  // CST structure from Chevrotain has the actual array inside the return value
  // The program rule returns an array, which should be directly usable
  if (Array.isArray(cst)) {
    // Direct array return from the rule
    for (const item of cst) {
      if (item && item.children) {
        const astNode = convertStatement(item.children);
        if (astNode) {
          statements.push(astNode);
        }
      }
    }
  } else if (cst && typeof cst === 'object') {
    // CST might have a different structure - check for children
    if (cst.children && cst.children.statement) {
      for (const stmt of cst.children.statement) {
        const astNode = convertStatement(stmt.children);
        if (astNode) {
          statements.push(astNode);
        }
      }
    }
  }

  return {
    type: 'Program',
    body: statements,
  };
}

function convertStatement(children: any): ASTNode | null {
  if (children.importDeclaration) {
    return convertImportDeclaration(children.importDeclaration[0].children);
  }
  if (children.pageDeclaration) {
    return convertPageDeclaration(children.pageDeclaration[0].children);
  }
  if (children.dataDeclaration) {
    return convertDataDeclaration(children.dataDeclaration[0].children);
  }
  if (children.functionDeclaration) {
    return convertFunctionDeclaration(children.functionDeclaration[0].children);
  }
  if (children.variableDeclaration) {
    return convertVariableDeclaration(children.variableDeclaration[0].children);
  }
  if (children.returnStatement) {
    return convertReturnStatement(children.returnStatement[0].children);
  }
  if (children.expressionStatement) {
    return convertExpressionStatement(children.expressionStatement[0].children);
  }
  return null;
}

function convertPageDeclaration(children: any): PageDeclarationNode {
  const path = children.StringLiteral[0].image.slice(1, -1); // Remove quotes
  const body = convertBlockStatement(children.blockStatement[0].children);

  return {
    type: 'PageDeclaration',
    path,
    body,
  };
}

function convertDataDeclaration(children: any): DataDeclarationNode {
  const id: IdentifierNode = {
    type: 'Identifier',
    name: children.Identifier[0].image,
  };
  const init = convertExpression(children.expression[0].children);

  return {
    type: 'DataDeclaration',
    id,
    init,
  };
}

function convertImportDeclaration(children: any): ImportDeclarationNode {
  const specifiers: ImportSpecifier[] = [];
  
  if (children.importSpecifier) {
    for (const spec of children.importSpecifier) {
      const name = spec.children.Identifier[0].image;
      specifiers.push({
        type: 'ImportSpecifier',
        imported: name,
        local: name,
      });
    }
  }
  
  const source = children.StringLiteral[0].image.slice(1, -1); // Remove quotes

  return {
    type: 'ImportDeclaration',
    specifiers,
    source,
  };
}

function convertFunctionDeclaration(children: any): FunctionDeclarationNode {
  const annotations: AnnotationNode[] = [];
  
  if (children.annotation) {
    for (const anno of children.annotation) {
      const args: any[] = [];
      
      // Parse annotation arguments if present
      if (anno.children.annotationArgument) {
        for (const arg of anno.children.annotationArgument) {
          if (arg.children.StringLiteral) {
            args.push(arg.children.StringLiteral[0].image.slice(1, -1)); // Remove quotes
          } else if (arg.children.NumberLiteral) {
            args.push(parseFloat(arg.children.NumberLiteral[0].image));
          } else if (arg.children.Identifier) {
            args.push(arg.children.Identifier[0].image);
          }
        }
      }
      
      annotations.push({
        type: 'Annotation',
        name: anno.children.Identifier[0].image,
        args: args.length > 0 ? args : undefined,
      });
    }
  }

  const isAsync = !!children.Async;
  const name = children.Identifier[0].image;
  const params: ParameterNode[] = [];

  if (children.parameter) {
    for (const param of children.parameter) {
      params.push({
        type: 'Parameter',
        name: param.children.Identifier[0].image,
        typeAnnotation: param.children.Identifier?.[1]?.image,
      });
    }
  }

  const body = convertBlockStatement(children.blockStatement[0].children);

  return {
    type: 'FunctionDeclaration',
    name,
    params,
    body,
    async: isAsync,
    annotations: annotations.length > 0 ? annotations : undefined,
  };
}

function convertVariableDeclaration(children: any): VariableDeclarationNode {
  // In CST, OR alternatives are captured with their token names
  const kind: 'let' | 'const' = children.Let ? 'let' : 'const';
  const id: IdentifierNode = {
    type: 'Identifier',
    name: children.Identifier[0].image,
  };
  const init = convertExpression(children.expression[0].children);

  return {
    type: 'VariableDeclaration',
    kind,
    declarations: [
      {
        type: 'VariableDeclarator',
        id,
        init,
      },
    ],
  };
}

function convertReturnStatement(children: any): ReturnStatementNode {
  const argument = children.expression?.[0]
    ? convertExpression(children.expression[0].children)
    : undefined;

  return {
    type: 'ReturnStatement',
    argument,
  };
}

function convertExpressionStatement(children: any): ExpressionStatementNode {
  return {
    type: 'ExpressionStatement',
    expression: convertExpression(children.expression[0].children),
  };
}

function convertBlockStatement(children: any): BlockStatementNode {
  const body: ASTNode[] = [];

  if (children.statement) {
    for (const stmt of children.statement) {
      const node = convertStatement(stmt.children);
      if (node) {
        body.push(node);
      }
    }
  }

  return {
    type: 'BlockStatement',
    body,
  };
}

function convertExpression(children: any): ASTNode {
  // Use Pratt parser for all expressions via bridge
  try {
    return parseExpressionFromCst(children);
  } catch (error) {
    // Fallback to legacy conversion for complex pipeline expressions
    // that the Pratt parser might not handle yet
    if (children.pipelineExpression) {
      return convertPipelineExpression(children.pipelineExpression[0].children);
    }
    // Re-throw with context
    throw new Error(`Expression conversion failed: ${(error as Error).message}`);
  }
}

function convertPipelineExpression(children: any): ASTNode {
  // Check if this is a raw CST node with intermediate representation
  if (children.type === 'pipeline') {
    return {
      type: 'PipelineExpression',
      left: convertExpressionFromIntermediate(children.left),
      right: convertExpressionFromIntermediate(children.right),
    };
  }
  
  // Otherwise, it's a regular CST node - build tree from CST
  // The CST will have: binaryExpression (multiple), Pipeline tokens
  if (children.binaryExpression) {
    let result: ASTNode = convertBinaryExpression(children.binaryExpression[0].children);
    
    // If there are Pipeline tokens, we have pipelining
    if (children.Pipeline) {
      for (let i = 0; i < children.Pipeline.length; i++) {
        const right = convertBinaryExpression(children.binaryExpression[i + 1].children);
        result = {
          type: 'PipelineExpression',
          left: result,
          right,
        };
      }
    }
    
    return result;
  }
  return convertBinaryExpression(children);
}

function convertBinaryExpression(children: any): ASTNode {
  // Check if this is a raw CST node with intermediate representation
  if (children.type === 'binary') {
    return {
      type: 'BinaryExpression',
      operator: children.operator.image,
      left: convertExpressionFromIntermediate(children.left),
      right: convertExpressionFromIntermediate(children.right),
    };
  }
  
  // Otherwise, it's a regular CST node - build tree from CST
  // The CST will have: primaryExpression (multiple), operator tokens (Plus, Minus, etc.)
  if (children.primaryExpression) {
    let result: ASTNode = convertPrimaryExpression(children.primaryExpression[0].children);
    
    // Check for operators
    const operators = ['Plus', 'Minus', 'Multiply', 'Divide', 'GreaterThan', 'LessThan'];
    for (const op of operators) {
      if (children[op]) {
        // We have binary operations
        for (let i = 0; i < children[op].length; i++) {
          const right = convertPrimaryExpression(children.primaryExpression[i + 1].children);
          result = {
            type: 'BinaryExpression',
            operator: children[op][i].image,
            left: result,
            right,
          };
        }
        break; // Only one operator type at a time (for now, no mixed precedence)
      }
    }
    
    return result;
  }
  return convertPrimaryExpression(children);
}

// Helper to convert intermediate representation created in parser rules
function convertExpressionFromIntermediate(intermediate: any): ASTNode {
  if (intermediate.type === 'pipeline') {
    return {
      type: 'PipelineExpression',
      left: convertExpressionFromIntermediate(intermediate.left),
      right: convertExpressionFromIntermediate(intermediate.right),
    };
  }
  if (intermediate.type === 'binary') {
    return {
      type: 'BinaryExpression',
      operator: intermediate.operator.image,
      left: convertExpressionFromIntermediate(intermediate.left),
      right: convertExpressionFromIntermediate(intermediate.right),
    };
  }
  if (intermediate.type === 'await') {
    return {
      type: 'AwaitExpression',
      argument: convertExpressionFromIntermediate(intermediate.argument),
    };
  }
  if (intermediate.type === 'call') {
    return {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: intermediate.callee.image },
      arguments: intermediate.args.map((arg: any) => convertExpressionFromIntermediate(arg)),
    };
  }
  if (intermediate.children) {
    // It's a CST node, convert normally
    return convertPrimaryExpression(intermediate.children);
  }
  // It's a token
  if (intermediate.tokenType) {
    if (intermediate.tokenType.name === 'Identifier') {
      return { type: 'Identifier', name: intermediate.image };
    }
    if (intermediate.tokenType.name === 'NumberLiteral') {
      return { type: 'Literal', value: parseFloat(intermediate.image), raw: intermediate.image };
    }
    if (intermediate.tokenType.name === 'StringLiteral') {
      return { type: 'Literal', value: intermediate.image.slice(1, -1), raw: intermediate.image };
    }
    if (intermediate.tokenType.name === 'BooleanLiteral') {
      return { type: 'Literal', value: intermediate.image === 'true', raw: intermediate.image };
    }
  }
  throw new Error('Unknown intermediate representation');
}

function convertPrimaryExpression(children: any): ASTNode {
  if (children.awaitExpression) {
    return convertAwaitExpression(children.awaitExpression[0].children);
  }
  if (children.arrayLiteral) {
    return convertArrayLiteral(children.arrayLiteral[0].children);
  }
  if (children.objectLiteral) {
    return convertObjectLiteral(children.objectLiteral[0].children);
  }
  if (children.callExpression) {
    return convertCallExpression(children.callExpression[0].children);
  }
  if (children.literal) {
    return convertLiteral(children.literal[0].children);
  }
  if (children.identifier) {
    return convertIdentifier(children.identifier[0].children);
  }
  if (children.expression) {
    // Parenthesized expression
    return convertExpression(children.expression[0].children);
  }
  throw new Error('Unknown primary expression');
}

function convertAwaitExpression(children: any): ASTNode {
  return {
    type: 'AwaitExpression',
    argument: convertPrimaryExpression(children.primaryExpression[0].children),
  };
}

function convertCallExpression(children: any): ASTNode {
  return {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: children.Identifier[0].image },
    arguments: children.expression ? children.expression.map((arg: any) => convertExpression(arg.children)) : [],
  };
}

function convertLiteral(children: any): LiteralNode {
  let token: IToken;
  let value: any;

  if (children.TemplateLiteral) {
    token = children.TemplateLiteral[0];
    // Keep template literal as-is with backticks for codegen to handle interpolation
    value = token.image;
  } else if (children.StringLiteral) {
    token = children.StringLiteral[0];
    value = token.image.slice(1, -1); // Remove quotes
  } else if (children.NumberLiteral) {
    token = children.NumberLiteral[0];
    value = parseFloat(token.image);
  } else if (children.BooleanLiteral) {
    token = children.BooleanLiteral[0];
    value = token.image === 'true';
  } else {
    throw new Error('Unknown literal type');
  }

  return {
    type: 'Literal',
    value,
    raw: token.image,
  };
}

function convertIdentifier(children: any): IdentifierNode {
  return {
    type: 'Identifier',
    name: children.Identifier[0].image,
  };
}

function convertArrayLiteral(children: any): ASTNode {
  const elements: ASTNode[] = [];
  if (children.expression) {
    for (const expr of children.expression) {
      elements.push(convertExpression(expr.children));
    }
  }
  return {
    type: 'ArrayExpression',
    elements,
  };
}

function convertObjectLiteral(children: any): ASTNode {
  const properties: any[] = [];
  if (children.objectProperty) {
    for (const prop of children.objectProperty) {
      const propChildren = prop.children;
      const key = propChildren.key ? propChildren.key[0].children.Identifier[0].image : propChildren.Identifier[0].image;
      const value = convertExpression(propChildren.value ? propChildren.value[0].children : propChildren.expression[0].children);
      properties.push({ key, value });
    }
  }
  return {
    type: 'ObjectExpression',
    properties,
  };
}

export async function parse(text: string): Promise<ProgramNode> {
  const { tokenize } = await import('./lexer.js');
  const lexResult = tokenize(text);

  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.program();

  if (parserInstance.errors.length > 0) {
    const errors = parserInstance.errors.map(e => e.message).join('\n');
    throw new Error(`Parsing errors detected:\n${errors}`);
  }

  // CST is ready for conversion
  
  // Convert CST to AST
  return cstToAst(cst);
}

