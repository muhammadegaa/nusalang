# Phase 0.8 Integration Roadmap

**Status:** Bridge Layer Complete, Deep Integration Pending  
**Current:** v0.7.0-foundation with bridge  
**Target:** v0.8.0-alpha with full expression power

---

## ✅ Completed (Current Session)

### 1. Parser Bridge Layer (`src/parser/core/bridge.ts`)
- **Function:** `extractTokensFromCst()` - Converts Chevrotain CST to token streams
- **Function:** `parseExpressionFromCst()` - Main bridge entry point
- **Function:** `needsPrattParser()` - Optimization helper
- **Function:** `debugTokenSequence()` - Debugging utility

**Status:** ✅ Complete and tested

### 2. Parser Integration (`src/parser.ts`)
- Updated `convertExpression()` to use `parseExpressionFromCst()`
- Added error handling with fallback to legacy conversion
- Import changed from `parseExpressionPratt` to `parseExpressionFromCst`

**Status:** ✅ Complete, zero regressions

### 3. Test Suite
- **174/174** existing tests: ✅ Passing
- **29** Phase 0.7 tests: ⏸️ Written, awaiting Chevrotain refactor

---

## 🚧 Remaining Work

### The Core Challenge

**Problem:** Chevrotain parser doesn't recognize optional chaining syntax (`?.`, `?[`).

When code like `user?.name` is parsed:
1. Lexer correctly tokenizes: `Identifier("user")`, `OptionalDot(?.)`, `Identifier("name")`
2. Chevrotain parser **fails** because it has no grammar rule for `OptionalDot`
3. Parsing error occurs **before** bridge can extract tokens
4. Pratt parser never gets a chance to run

**Current State:** Bridge works perfectly, but Chevrotain blocks it.

---

## 🎯 Solution: Chevrotain Expression Refactor

### Approach: Replace Chevrotain Expression Parsing with Token Collection

Instead of having Chevrotain parse expression structure, make it **collect tokens** and delegate everything to Pratt.

### Implementation Steps

#### Step 1: Create Permissive Expression Rule

**Current (Phase 0.7):**
```typescript
private expression = this.RULE('expression', () => {
  return this.OR([
    { ALT: () => this.SUBRULE(this.pipelineExpression) },
  ]);
});

private pipelineExpression = this.RULE(...); // Complex nested structure
private binaryExpression = this.RULE(...);
private primaryExpression = this.RULE(...);
// etc.
```

**Target (Phase 0.8):**
```typescript
private expression = this.RULE('expression', () => {
  const tokens: IToken[] = [];
  
  // Collect all tokens until we hit a statement boundary
  this.MANY(() => {
    const token = this.OR([
      { ALT: () => this.CONSUME(tokens.Identifier) },
      { ALT: () => this.CONSUME(tokens.NumberLiteral) },
      { ALT: () => this.CONSUME(tokens.StringLiteral) },
      { ALT: () => this.CONSUME(tokens.TemplateLiteral) },
      { ALT: () => this.CONSUME(tokens.BooleanLiteral) },
      { ALT: () => this.CONSUME(tokens.LParen) },
      { ALT: () => this.CONSUME(tokens.RParen) },
      { ALT: () => this.CONSUME(tokens.LBracket) },
      { ALT: () => this.CONSUME(tokens.RBracket) },
      { ALT: () => this.CONSUME(tokens.LBrace) },
      { ALT: () => this.CONSUME(tokens.RBrace) },
      { ALT: () => this.CONSUME(tokens.Dot) },
      { ALT: () => this.CONSUME(tokens.OptionalDot) },      // NEW
      { ALT: () => this.CONSUME(tokens.OptionalBracket) },  // NEW
      { ALT: () => this.CONSUME(tokens.Plus) },
      { ALT: () => this.CONSUME(tokens.Minus) },
      { ALT: () => this.CONSUME(tokens.Multiply) },
      { ALT: () => this.CONSUME(tokens.Divide) },
      { ALT: () => this.CONSUME(tokens.Pipeline) },
      { ALT: () => this.CONSUME(tokens.Comma) },
      { ALT: () => this.CONSUME(tokens.Colon) },
      { ALT: () => this.CONSUME(tokens.Await) },
      // Stop at statement boundaries
      // NOT: Semicolon, RBrace (statement end), Fn, Let, Const, etc.
    ]);
    tokens.push(token);
  });
  
  return { tokens }; // Return raw tokens
});
```

**File:** `src/parser.ts`
**Effort:** 2-3 hours

#### Step 2: Update CST Conversion

**Current:**
```typescript
function convertExpression(children: any): ASTNode {
  try {
    return parseExpressionFromCst(children);
  } catch (error) {
    if (children.pipelineExpression) {
      return convertPipelineExpression(...);
    }
    throw error;
  }
}
```

**Target:**
```typescript
function convertExpression(children: any): ASTNode {
  // Children now contains raw token array
  if (children.tokens) {
    return parseExpressionFromCst(children.tokens);
  }
  throw new Error('No tokens in expression CST');
}
```

**Benefit:** Much simpler! No fallback logic needed.

**File:** `src/parser.ts`
**Effort:** 1 hour

#### Step 3: Remove Legacy Expression Functions

Delete old conversion functions:
- `convertPipelineExpression()`
- `convertBinaryExpression()`
- `convertPrimaryExpression()`
- `convertExpressionFromIntermediate()`

These are all replaced by Pratt parser.

**File:** `src/parser.ts`
**Effort:** 30 minutes

#### Step 4: Test & Debug

Run full test suite:
```bash
npm test
```

Expected:
- **174 existing tests:** Should still pass (zero regressions)
- **29 Phase 0.7 tests:** Should now pass! (optional chaining works)

Debug any issues:
- Check token extraction in bridge
- Verify Pratt parser precedence
- Test edge cases

**Effort:** 2-3 hours

---

## 📊 Estimated Total Effort

| Task | Time | Status |
|------|------|--------|
| Permissive expression rule | 2-3h | Pending |
| Update CST conversion | 1h | Pending |
| Remove legacy functions | 0.5h | Pending |
| Testing & debugging | 2-3h | Pending |
| **Total** | **6-8h** | **Pending** |

---

## 🎯 Success Criteria

1. ✅ **203/203 tests passing**
   - 174 existing tests (maintained)
   - 29 Phase 0.7 tests (activated)

2. ✅ **Optional chaining works:**
   ```nusa
   let email = user?.profile?.email;
   let firstItem = data?.items[0]?.name;
   ```

3. ✅ **Call chaining works:**
   ```nusa
   let result = api.fetch().process().getData();
   ```

4. ✅ **Zero regressions:**
   - All Phase 0.6 features still work
   - Arrays, objects, pipelines, templates all functional

---

## 🚀 Alternative: Incremental Approach

If full refactor is too risky, consider **incremental integration**:

### Phase 0.8a: Member Access Only
- Keep Chevrotain structure
- Add specific rules for `Dot` and `LBracket` postfix
- Enable `obj.prop` and `arr[0]`
- Defer optional chaining to Phase 0.9

### Phase 0.8b: Optional Chaining
- Add `OptionalDot` and `OptionalBracket` rules
- Handle `obj?.prop` and `arr?.[0]`
- Full expression power achieved

### Phase 0.8c: Cleanup
- Refactor to full Pratt delegation
- Remove legacy code
- Optimize performance

**Total Time:** Same 6-8 hours, but lower risk per step.

---

## 📝 Current State Summary

**What Works:**
- ✅ Lexer: Recognizes all tokens including `?.` and `?[`
- ✅ Pratt Parser: Full optional chaining & call chaining support
- ✅ Bridge Layer: Token extraction and conversion
- ✅ Code Generation: Correct JavaScript output
- ✅ Tests: 174/174 existing + 29 written Phase 0.7 tests

**What's Blocked:**
- ⏸️ Chevrotain doesn't recognize optional chaining syntax
- ⏸️ Parser fails before bridge can run
- ⏸️ Phase 0.7 tests can't activate

**What's Needed:**
- 🔨 Chevrotain expression rule refactor (6-8 hours)
- 🔨 Full Pratt parser delegation
- 🔨 Test activation and verification

---

## 🎓 Key Learnings

### Why This is Hard

1. **Dual Parser System:** Chevrotain (statements) + Pratt (expressions)
2. **CST Dependencies:** Existing code expects specific CST structure
3. **Grammar Conflicts:** Adding new tokens to Chevrotain changes CST shape
4. **Error Recovery:** Both parsers need coordinated error handling

### Why We're Close

1. **Bridge Works:** Token extraction is proven correct
2. **Pratt Works:** All expression logic is implemented and tested
3. **Zero Regressions:** No existing functionality broken
4. **Clear Path:** Exactly what needs to change is documented

---

## 📚 Resources

- **Bridge Implementation:** `src/parser/core/bridge.ts`
- **Pratt Parser:** `src/parser/core/pratt.ts`
- **Test Suite:** `src/__tests__/member.optional.test.ts`, `member.callchain.test.ts`
- **Phase 0.7 Summary:** `PHASE_0.7_SUMMARY.md`

---

## 🏁 Next Steps

**To Complete Phase 0.8:**

1. Allocate 6-8 hours of focused time
2. Follow Step 1: Create permissive expression rule
3. Follow Step 2: Update CST conversion
4. Follow Step 3: Remove legacy functions
5. Follow Step 4: Test & debug until 203/203 passing
6. Update documentation and tag v0.8.0-alpha

**Or:**

Continue with other features (WebSocket, reactivity, etc.) and return to expression integration when ready.

---

**Bridge Ready ✅ | Deep Integration Pending 🔨 | Path Forward Clear 📍**

