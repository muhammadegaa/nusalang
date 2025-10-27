/**
 * Lexer for NusaLang
 * Tokenizes NusaLang source code using Chevrotain
 */

import { createToken, Lexer, TokenType } from 'chevrotain';

// Keywords
export const Fn = createToken({ name: 'Fn', pattern: /fn/ });
export const Let = createToken({ name: 'Let', pattern: /let/ });
export const Const = createToken({ name: 'Const', pattern: /const/ });
export const Import = createToken({ name: 'Import', pattern: /import/ });
export const From = createToken({ name: 'From', pattern: /from/ });
export const Return = createToken({ name: 'Return', pattern: /return/ });
export const Async = createToken({ name: 'Async', pattern: /async/ });
export const Await = createToken({ name: 'Await', pattern: /await/ });
export const Page = createToken({ name: 'Page', pattern: /page/ });
export const Ui = createToken({ name: 'Ui', pattern: /ui/ });
export const Data = createToken({ name: 'Data', pattern: /data/ });

// Operators
export const Pipeline = createToken({ name: 'Pipeline', pattern: /\|>/ });
export const Arrow = createToken({ name: 'Arrow', pattern: /=>/ });
export const OptionalDot = createToken({ name: 'OptionalDot', pattern: /\?\./ });
export const OptionalBracket = createToken({ name: 'OptionalBracket', pattern: /\?\[/ });
export const Equals = createToken({ name: 'Equals', pattern: /=/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const JSXSelfClose = createToken({ name: 'JSXSelfClose', pattern: /\/>/ });
export const JSXClose = createToken({ name: 'JSXClose', pattern: /<\// });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });

// Delimiters
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const LBrace = createToken({ name: 'LBrace', pattern: /\{/ });
export const RBrace = createToken({ name: 'RBrace', pattern: /\}/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /\]/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const At = createToken({ name: 'At', pattern: /@/ });

// Literals
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});
export const TemplateLiteral = createToken({
  name: 'TemplateLiteral',
  pattern: /`(?:[^`\\]|\\.)*`/,
  line_breaks: true,
});
export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /\d+(\.\d+)?/,
});
export const BooleanLiteral = createToken({
  name: 'BooleanLiteral',
  pattern: /true|false/,
});

// Identifier (must come after keywords)
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// Whitespace and Comments
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const Comment = createToken({
  name: 'Comment',
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const MultiLineComment = createToken({
  name: 'MultiLineComment',
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED,
});

// Token ordering matters! Keywords must come before Identifier
export const allTokens: TokenType[] = [
  WhiteSpace,
  Comment,
  MultiLineComment,
  
  // Keywords
  Fn,
  Let,
  Const,
  Import,
  From,
  Return,
  Async,
  Await,
  Page,
  Ui,
  Data,
  BooleanLiteral,
  
  // Operators (multi-char first)
  Pipeline,
  Arrow,
  OptionalDot,
  OptionalBracket,
  JSXSelfClose,
  JSXClose,
  Equals,
  Plus,
  Minus,
  Multiply,
  Divide,
  GreaterThan,
  LessThan,
  
  // Delimiters
  LParen,
  RParen,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Comma,
  Semicolon,
  Colon,
  Dot,
  At,
  
  // Literals
  TemplateLiteral,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  
  // Identifier must be last after all keywords
  Identifier,
];

export const NusaLexer = new Lexer(allTokens, {
  positionTracking: 'full',
});

export function tokenize(text: string) {
  const lexingResult = NusaLexer.tokenize(text);
  
  if (lexingResult.errors.length > 0) {
    throw new Error(`Lexing errors detected:\n${lexingResult.errors.map(e => e.message).join('\n')}`);
  }
  
  return lexingResult;
}

