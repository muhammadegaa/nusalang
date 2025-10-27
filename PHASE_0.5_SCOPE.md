# Phase 0.5 - Refined Pragmatic Scope

## What's In (High-Impact, Low-Complexity)

### M2: Template Literals ✅
**Value**: Developer ergonomics, string interpolation  
**Complexity**: Low - straightforward lexer + parser  
**Deliverable**: `` `Hello, ${name}!` `` syntax

### M4: .nusarc Configuration ✅  
**Value**: Project configuration foundation  
**Complexity**: Low - JSON parsing + config loading  
**Deliverable**: Project-wide settings for port, DB, etc.

## What's Deferred to Phase 0.6

### M1: Expression Enhancements (Arrays, Objects, Member Access)
**Reason**: All three hit Chevrotain CST complexity  
**Impact**: Requires parser architecture refactor  
**Timeline**: Phase 0.6 with dedicated parser redesign

**Deferred syntax:**
- Array literals: `[1, 2, 3]`
- Object literals: `{ key: value }`
- Member expressions: `obj.prop`, `arr[0]`
- Method calls: `console.log()`

## Phase 0.5 Value Proposition

**Focus**: Developer experience enhancements that work with existing Phase 0.4 language  
**Result**: Template literals + project configuration = cleaner, more maintainable code  
**Stability**: 142/142 tests passing, zero regressions  

## Timeline

- **Phase 0.5**: Templates + Config (2-3 hours remaining)
- **Phase 0.6**: Complete expression system with parser refactor

This approach maintains momentum while avoiding deep technical debt.

