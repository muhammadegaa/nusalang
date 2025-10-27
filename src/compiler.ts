/**
 * Main Compiler Interface
 * Orchestrates lexing, parsing, and code generation
 */

import { tokenize } from './lexer.js';
import { parse } from './parser.js';
import { generateCode } from './codegen.js';
import { ProgramNode } from './ast.js';

export interface CompileOptions {
  sourceFile?: string;
  debug?: boolean;
}

export interface CompileResult {
  code: string;
  ast?: ProgramNode;
  success: boolean;
  errors?: string[];
}

export async function compile(source: string, options: CompileOptions = {}): Promise<CompileResult> {
  try {
    // Step 1: Tokenize
    if (options.debug) {
      console.log('[Compiler] Tokenizing...');
    }
    tokenize(source);

    // Step 2: Parse
    if (options.debug) {
      console.log('[Compiler] Parsing...');
    }
    const ast = await parse(source);

    // Step 3: Generate code
    if (options.debug) {
      console.log('[Compiler] Generating code...');
    }
    const code = await generateCode(ast);

    return {
      code,
      ast: options.debug ? ast : undefined,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      code: '',
      success: false,
      errors: [errorMessage],
    };
  }
}

export async function compileToString(source: string): Promise<string> {
  const result = await compile(source);
  if (!result.success) {
    throw new Error(result.errors?.join('\n') || 'Compilation failed');
  }
  return result.code;
}

