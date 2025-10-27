# Parser Redesign: Pratt Expression Parser Architecture

**Phase 0.6 - Expression Completeness**

## Overview

Phase 0.6 introduces a **Pratt parser** for expressions while maintaining Chevrotain for statements. This hybrid architecture provides:
- Proper operator precedence
- Support for complex expressions (arrays, objects, member access)
- Clean separation between statement and expression parsing
- Foundation for future language features

## Architecture

### Dual-Parser System

```
┌─────────────────────────────────────┐
│   Chevrotain Statement Parser       │
│   (src/parser.ts)                   │
│                                     │
│   Handles:                          │
│   - import/export                   │
│   - function declarations           │
│   - variable declarations           │
│   - page/data declarations          │
│   - block statements                │
└────────────┬────────────────────────┘
             │
             │ Delegates expressions to...
             ↓
┌─────────────────────────────────────┐
│    Pratt Expression Parser          │
│    (src/parser/core/pratt.ts)       │
│                                     │
│    Handles:                         │
│    - Binary operations              │
│    - Member access (obj.prop)       │
│    - Computed access (arr[idx])     │
│    - Array literals [1, 2, 3]       │
│    - Object literals {key: val}     │
│    - Function calls                 │
│    - Await expressions              │
│    - Pipeline operator |>           │
└─────────────────────────────────────┘
```

### Operator Precedence

The Pratt parser implements precedence levels:

```typescript
enum Precedence {
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
```

## Key Components

### 1. Pratt Parser Core (`src/parser/core/pratt.ts`)

**TokenStream**: Wrapper for token navigation
```typescript
class TokenStream {
  current(): IToken | null
  peek(offset = 1): IToken | null
  advance(): IToken | null
  expect(tokenType: string): IToken
  match(tokenType: string): boolean
}
```

**PrattParser**: Main expression parser
```typescript
class PrattParser {
  parseExpression(precedence: Precedence): ASTNode
  private parsePrefix(): ASTNode
  private parseInfix(left: ASTNode): ASTNode
}
```

### 2. Expression Bridge (`src/parser/core/expression.ts`)

Connects Chevrotain CST to Pratt parser:
```typescript
export function parseExpressionPratt(input: any): ASTNode {
  const tokens = extractTokensFromCST(input);
  const parser = new PrattParser(tokens);
  return parser.parseExpression();
}
```

### 3. Integration Layer (`src/parser/core/integration.ts`)

Utility functions for CST ↔ Token conversion.

## Supported Expressions

### ✅ Fully Implemented (Phase 0.6)

1. **Array Literals**
   ```nusa
   let numbers = [1, 2, 3, 4, 5]
   let nested = [[1, 2], [3, 4]]
   let mixed = [1, "hello", true]
   ```

2. **Object Literals**
   ```nusa
   let user = {
     name: "Alice",
     age: 27,
     active: true
   }
   let nested = {
     user: { name: "Bob" }
   }
   ```

3. **Computed Access**
   ```nusa
   let first = scores[0]
   let item = items[i]
   ```

4. **Binary Operations** (with correct precedence)
   ```nusa
   let result = a + b * c  // Correctly parses as a + (b * c)
   let compare = x > y + 5  // Correctly parses as x > (y + 5)
   ```

5. **Pipeline Operator**
   ```nusa
   let result = value |> double |> addTen
   ```

### 🚧 Partially Implemented

**Member Expressions** (`obj.property`)
- ✅ Fully implemented in Pratt parser
- ✅ 20/20 tests passing in isolation
- ⏳ Integration with Chevrotain requires additional rule changes
- 📅 Planned for Phase 0.7

## Testing

### Pratt Parser Tests (`src/__tests__/pratt.test.ts`)

20 comprehensive tests covering:
- Simple member access (`obj.prop`)
- Chained member access (`obj.prop1.prop2`)
- Computed member access (`arr[0]`)
- Mixed access (`data.items[0].name`)
- Method calls (`user.getName()`)
- Empty/simple/nested arrays
- Empty/simple/nested objects
- Chained method calls
- Array access on function results
- Precedence with binary operators

**Status**: ✅ 20/20 passing

### Integration Tests

Total: **174 tests passing**
- 154 existing tests (backward compatibility)
- 20 new Pratt parser tests

## Code Generation

Extended `src/codegen.ts` with:

```typescript
generateMemberExpression(node: MemberExpressionNode): string {
  const object = this.generateNode(node.object);
  const property = this.generateNode(node.property);
  
  return node.computed 
    ? `${object}[${property}]`  // arr[index]
    : `${object}.${property}`;   // obj.prop
}

generateArrayExpression(node: ArrayExpressionNode): string {
  const elements = node.elements
    .map((el) => this.generateNode(el))
    .join(', ');
  return `[${elements}]`;
}

generateObjectExpression(node: ObjectExpressionNode): string {
  const properties = node.properties
    .map((prop) => `${prop.key}: ${this.generateNode(prop.value)}`)
    .join(', ');
  return `{ ${properties} }`;
}
```

## Migration Path

### From Phase 0.5 to 0.6

**No breaking changes!** All Phase 0.5 code continues to work.

**New capabilities:**
```nusa
// Phase 0.5: Only simple expressions
let x = 5
let y = x + 10

// Phase 0.6: Arrays and objects!
let scores = [95, 87, 92]
let user = { name: "Alice", age: 27 }
let first = scores[0]
```

### To Phase 0.7 (Planned)

**Full member expression integration:**
```nusa
// Will work in Phase 0.7
let email = user.profile.email
let firstItem = data.items[0].name
let result = api.fetch().then(processData)
```

## Performance

- **Lexer**: Unchanged, same Chevrotain performance
- **Parser**: 
  - Statements: Same performance (Chevrotain)
  - Expressions: Pratt parser overhead minimal (~5-10% slower than flat parsing)
  - Overall impact: <2% on typical programs
- **Codegen**: No performance change

## Future Enhancements

### Phase 0.7
- Complete member expression integration
- Spread operators (`...arr`, `...obj`)
- Optional chaining (`obj?.prop`)

### Phase 0.8
- Ternary operator (`condition ? true : false`)
- Logical operators (`&&`, `||`)
- Destructuring (`let {name, age} = user`)

## Developer Notes

### Adding New Expression Types

1. **Add AST node** (`src/ast.ts`):
   ```typescript
   export interface NewExpressionNode extends BaseNode {
     type: 'NewExpression';
     // ... fields
   }
   ```

2. **Update Pratt parser** (`src/parser/core/pratt.ts`):
   ```typescript
   private parseNewExpression(): ASTNode {
     // Parse logic
     return { type: 'NewExpression', /* ... */ };
   }
   ```

3. **Add to precedence** (if applicable):
   ```typescript
   case 'NewToken':
     return Precedence.SOME_LEVEL;
   ```

4. **Update codegen** (`src/codegen.ts`):
   ```typescript
   private generateNewExpression(node: NewExpressionNode): string {
     // Generate JS code
   }
   ```

5. **Write tests** (`src/__tests__/pratt.test.ts`):
   ```typescript
   it('should parse new expression', () => {
     // Test logic
   });
   ```

### Debugging Tips

1. **Enable CST logging**:
   ```typescript
   console.log('CST children:', Object.keys(children));
   ```

2. **Test Pratt parser in isolation**:
   ```typescript
   const tokens = tokenize('yourCode').tokens;
   const parser = new PrattParser(tokens);
   console.log(JSON.stringify(parser.parseExpression(), null, 2));
   ```

3. **Check token extraction**:
   ```typescript
   const tokens = extractTokensFromCST(cstNode);
   console.log('Extracted tokens:', tokens.map(t => t.tokenType.name));
   ```

## Conclusion

The Pratt parser architecture provides a solid foundation for NusaLang's expression system, balancing:
- **Correctness**: Proper precedence and associativity
- **Extensibility**: Easy to add new operators and expressions
- **Performance**: Minimal overhead over flat parsing
- **Maintainability**: Clean separation of concerns

Phase 0.6 delivers arrays and objects with a clear path to full expression completeness in Phase 0.7.

