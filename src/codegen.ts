/**
 * Code Generator for NusaLang
 * Converts AST to JavaScript code
 */

import * as prettier from 'prettier';
import {
  ASTNode,
  ProgramNode,
  ImportDeclarationNode,
  FunctionDeclarationNode,
  VariableDeclarationNode,
  ExpressionStatementNode,
  ReturnStatementNode,
  BlockStatementNode,
  CallExpressionNode,
  MemberExpressionNode,
  ArrayExpressionNode,
  ObjectExpressionNode,
  IdentifierNode,
  LiteralNode,
  BinaryExpressionNode,
  PipelineExpressionNode,
  AwaitExpressionNode,
  PageDeclarationNode,
  DataDeclarationNode,
} from './ast.js';

export class CodeGenerator {
  private indentLevel = 0;
  private indentString = '  ';

  async generate(ast: ProgramNode): Promise<string> {
    const code = this.generateProgram(ast);
    return await this.formatCode(code);
  }

  private async formatCode(code: string): Promise<string> {
    try {
      return await prettier.format(code, {
        parser: 'babel',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
      });
    } catch (error) {
      // If formatting fails, return unformatted code
      console.warn('Prettier formatting failed, returning unformatted code');
      return code;
    }
  }

  private generateProgram(node: ProgramNode): string {
    return node.body.map((stmt) => this.generateNode(stmt)).join('\n');
  }

  private generateNode(node: ASTNode): string {
    switch (node.type) {
      case 'Program':
        return this.generateProgram(node);
      case 'ImportDeclaration':
        return this.generateImportDeclaration(node);
      case 'PageDeclaration':
        return this.generatePageDeclaration(node);
      case 'DataDeclaration':
        return this.generateDataDeclaration(node);
      case 'FunctionDeclaration':
        return this.generateFunctionDeclaration(node);
      case 'VariableDeclaration':
        return this.generateVariableDeclaration(node);
      case 'ExpressionStatement':
        return this.generateExpressionStatement(node);
      case 'ReturnStatement':
        return this.generateReturnStatement(node);
      case 'BlockStatement':
        return this.generateBlockStatement(node);
      case 'CallExpression':
        return this.generateCallExpression(node);
      case 'MemberExpression':
        return this.generateMemberExpression(node);
      case 'ArrayExpression':
        return this.generateArrayExpression(node);
      case 'ObjectExpression':
        return this.generateObjectExpression(node);
      case 'Identifier':
        return this.generateIdentifier(node);
      case 'Literal':
        return this.generateLiteral(node);
      case 'BinaryExpression':
        return this.generateBinaryExpression(node);
      case 'PipelineExpression':
        return this.generatePipelineExpression(node);
      case 'AwaitExpression':
        return this.generateAwaitExpression(node);
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
    }
  }

  private generateImportDeclaration(node: ImportDeclarationNode): string {
    const specifiers = node.specifiers.map((spec) => spec.local).join(', ');
    return `import { ${specifiers} } from '${node.source}';`;
  }

  private generatePageDeclaration(node: PageDeclarationNode): string {
    // Generate page registration code with async handler
    const body = this.generateBlockStatement(node.body);
    
    return `page('${node.path}', async () => ${body});`;
  }

  private generateDataDeclaration(node: DataDeclarationNode): string {
    // Data declarations become const with await
    const varName = node.id.name;
    const init = this.generateNode(node.init);
    
    return `const ${varName} = await ${init};`;
  }

  private generateFunctionDeclaration(node: FunctionDeclarationNode): string {
    let code = '';

    // Handle annotations including @route for automatic HTTP endpoint exposure
    let routePath: string | undefined;
    if (node.annotations && node.annotations.length > 0) {
      for (const annotation of node.annotations) {
        if (annotation.name === 'route' && annotation.args && annotation.args.length > 0) {
          routePath = String(annotation.args[0]);
          code += `// @route("${routePath}")\n`;
        } else if (annotation.name === 'api') {
          code += `// @api\n`;
        } else {
          code += `// @${annotation.name}\n`;
        }
      }
    }

    const asyncKeyword = node.async ? 'async ' : '';
    const params = node.params.map((p) => p.name).join(', ');
    const body = this.generateBlockStatement(node.body);

    code += `${asyncKeyword}function ${node.name}(${params}) ${body}`;

    // Auto-register route if @route annotation is present
    if (routePath) {
      code += `\n\n// Auto-register route\nif (typeof router !== 'undefined') {\n`;
      code += `  router.registerPage('${routePath}', ${node.name});\n`;
      code += `}`;
    }

    return code;
  }

  private generateVariableDeclaration(node: VariableDeclarationNode): string {
    const declarations = node.declarations
      .map((decl) => {
        const init = decl.init ? ` = ${this.generateNode(decl.init)}` : '';
        return `${decl.id.name}${init}`;
      })
      .join(', ');

    return `${node.kind} ${declarations};`;
  }

  private generateExpressionStatement(node: ExpressionStatementNode): string {
    return `${this.generateNode(node.expression)};`;
  }

  private generateReturnStatement(node: ReturnStatementNode): string {
    if (node.argument) {
      return `return ${this.generateNode(node.argument)};`;
    }
    return 'return;';
  }

  private generateBlockStatement(node: BlockStatementNode): string {
    if (node.body.length === 0) {
      return '{}';
    }

    this.indentLevel++;
    const indent = this.indentString.repeat(this.indentLevel);
    const statements = node.body
      .map((stmt) => `${indent}${this.generateNode(stmt)}`)
      .join('\n');
    this.indentLevel--;

    return `{\n${statements}\n${this.indentString.repeat(this.indentLevel)}}`;
  }

  private generateCallExpression(node: CallExpressionNode): string {
    const callee = this.generateNode(node.callee);
    const args = node.arguments.map((arg) => this.generateNode(arg)).join(', ');
    return `${callee}(${args})`;
  }

  private generateIdentifier(node: IdentifierNode): string {
    return node.name;
  }

  private generateLiteral(node: LiteralNode): string {
    // Check if it's a template literal (starts with backtick)
    if (typeof node.raw === 'string' && node.raw.startsWith('`')) {
      // Template literal - return as-is (JS supports template literals natively)
      return node.raw;
    }
    if (typeof node.value === 'string') {
      return `'${node.value}'`;
    }
    return String(node.value);
  }

  private generateBinaryExpression(node: BinaryExpressionNode): string {
    const left = this.generateNode(node.left);
    const right = this.generateNode(node.right);
    return `${left} ${node.operator} ${right}`;
  }

  private generatePipelineExpression(node: PipelineExpressionNode): string {
    // Transform pipeline: x |> f(y) becomes f(x, y)
    // For simple case: x |> f becomes f(x)
    const left = this.generateNode(node.left);
    
    if (node.right.type === 'CallExpression') {
      const callNode = node.right as CallExpressionNode;
      const callee = this.generateNode(callNode.callee);
      const args = [left, ...callNode.arguments.map((arg) => this.generateNode(arg))].join(', ');
      return `${callee}(${args})`;
    } else if (node.right.type === 'Identifier') {
      const funcName = this.generateNode(node.right);
      return `${funcName}(${left})`;
    }
    
    throw new Error('Pipeline operator right side must be a function call or identifier');
  }

  private generateAwaitExpression(node: AwaitExpressionNode): string {
    return `await ${this.generateNode(node.argument)}`;
  }

  private generateMemberExpression(node: MemberExpressionNode): string {
    const object = this.generateNode(node.object);
    const property = this.generateNode(node.property);
    
    if (node.computed) {
      // arr[index]
      return `${object}[${property}]`;
    } else {
      // obj.prop
      return `${object}.${property}`;
    }
  }

  private generateArrayExpression(node: ArrayExpressionNode): string {
    const elements = node.elements.map((el) => this.generateNode(el)).join(', ');
    return `[${elements}]`;
  }

  private generateObjectExpression(node: ObjectExpressionNode): string {
    if (node.properties.length === 0) {
      return '{}';
    }

    const properties = node.properties
      .map((prop) => {
        const value = this.generateNode(prop.value);
        return `${prop.key}: ${value}`;
      })
      .join(', ');

    return `{ ${properties} }`;
  }
}

export async function generateCode(ast: ProgramNode): Promise<string> {
  const generator = new CodeGenerator();
  return await generator.generate(ast);
}

