# Changelog

All notable changes to NusaLang will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0-progress] - 2025-10-27

### 🚧 Phase 1.3: Advanced Chaining Foundation (Progress Release)

**NusaLang v1.3.0-progress** adds call chaining grammar foundation, achieving 200/222 tests passing (90%).

### ✨ New Features

#### Parser Enhancements
- **Call Chaining Grammar**: Extended `memberAccessExpression` with `LParen` handling
- **CST Conversion**: Added call operation tracking in token-based conversion
- **Function Calls**: `api()` and `process(getData())` fully working

### 📊 Test Results
- **200/222 tests passing** (90% - up from 197)
- **+3 new tests passing** (incremental progress)
- **Zero regressions** - all Phase 1.2 tests still pass
- **23/25 test files passing**

### ⏸️ Deferred → Phase 1.4 (Bridge Refactor)

**22 tests requiring bridge enhancement**:
- Call chaining after member access (`api.fetch().data`)
- Deep optional chaining (`data?.user?.profile?.email`)
- Optional computed access (`arr?.[index]`)
- Mixed complex chaining scenarios

**Root Cause**: Chevrotain CST flattens nested structures, making call argument grouping and operation sequencing difficult. Solution requires dedicated bridge refactor (4-6 hours).

### 📝 Documentation
- Added `PHASE_1.3_PROGRESS.md` with complete technical analysis
- Clear path forward for v1.3.0-complete
- Maintained backward compatibility

### 🎯 Strategy
Pragmatic progress release matching Phase 1.2 approach - ship foundation, defer complex integration to focused session.

---

## [1.2.0-alpha] - 2025-10-27

### 🚀 Phase 1.2: Member Access & Optional Chaining

**NusaLang v1.2.0-alpha** adds foundational member access and optional chaining through Chevrotain grammar enhancements.

### ✨ New Features

#### Member Access & Property Access
- **Member Access**: `obj.prop` - Direct property access on objects
- **Array Indexing**: `arr[0]` - Index-based array access
- **Optional Chaining**: `user?.name` - Safe property access with null/undefined handling

#### Parser Improvements
- New `memberAccessExpression` Chevrotain grammar rule
- Integrated member access into expression hierarchy
- Support for `MANY` repeated member access operations

### 🐛 Bug Fixes

#### Critical Bridge Fix
- **Token Ordering**: Fixed Chevrotain CST token extraction to sort by source position (`startOffset`)
- **Impact**: Resolved binary expression regression (`5 + 10` was generating incorrect output)
- **Root Cause**: CST groups tokens by type, not parse order; now explicitly sorted

### 📊 Test Results
- **197/197 tests passing** (100% of active tests)
- **24/24 test files passing** + 1 skipped (advanced features)
- **Zero regressions** - all 174 legacy tests still pass

### ⏸️ Deferred Features (Phase 1.3)
- Call chaining (`api.fetch().data`)
- Optional computed access (`arr?.[index]`)
- Deep optional chaining (`data?.user?.profile?.email`)
- Mixed chaining scenarios

### 📝 Documentation
- Added `PHASE_1.2_SUMMARY.md` with complete technical details
- Updated test files with clear deferral notes
- Maintained backward compatibility

---

## [1.0.0-alpha] - 2025-10-27

### 🎉 First Public Alpha Release

**NusaLang v1.0.0-alpha** marks the first publicly usable release with a stable compiler, reactive runtime, and complete documentation.

### ✨ Major Features

#### Reactive Runtime (Phase 0.9)
- **Signals**: Observable values with automatic subscriber notification
- **Computed Values**: Derived state that auto-updates when dependencies change
- **WebSocket Streaming**: Real-time data with `subscribe()` and `publish()` APIs
- 22 comprehensive tests for reactive runtime

#### Expression System (Phases 0.6-0.8)
- **Array Literals**: `[1, 2, 3]`, nested arrays, array indexing
- **Object Literals**: `{name: "Alice", age: 27}`, nested objects
- **Pratt Parser**: 465-line expression parser with proper operator precedence
- **Parser Bridge**: Foundation for full Pratt/Chevrotain integration

#### Language Features (Phases 0.4-0.5)
- **Template Literals**: Full `` `Hello, ${name}!` `` syntax with interpolation
- **Configuration System**: `.nusarc` project-level configuration
- **@route Annotations**: Declarative HTTP routing
- **Hot Reload**: Automatic recompilation with `--watch` flag
- **Database Persistence**: JSON file-based storage with adapters

#### Runtime & HTTP (Phases 0.2-0.3)
- **HTTP Server**: Built-in server with `nusa dev` command
- **UI Rendering**: Declarative page definitions
- **Runtime Execution**: Sandboxed JavaScript execution
- **Router System**: Automatic route registration
- **Mock Database**: In-memory CRUD operations

#### Compiler Foundation (Phase 0.1)
- **Functions**: `fn name(params) { body }`
- **Variables**: `let` and `const` declarations
- **Imports**: ES module-style imports
- **Async/Await**: Top-level await support
- **Pipeline Operator**: `value |> transform |> process`
- **API Annotations**: `@api` for endpoint exposure
- **Binary Expressions**: Arithmetic and comparison operators

### 📊 Statistics

- **193 Tests Passing** (23/25 test files)
- **~10,000 Lines of Code**
- **32 Source Files**
- **15 Example Applications**
- **Comprehensive Documentation**

### 🧪 Test Results

```
Test Files:  23 passed | 2 skipped (25)
Tests:       193 passed | 29 skipped (222)
```

*Note: 2 test files skipped pending full Pratt parser integration (Phase 1.1)*

### 📚 Documentation

- ✅ Getting Started Guide
- ✅ Runtime API Reference
- ✅ Compiler Architecture
- ✅ Roadmap
- ✅ 9 Phase Summaries (0.1-0.9)
- ✅ Parser Redesign Documentation

### 🎯 Known Limitations

#### Deferred to Phase 1.1
- Optional chaining (`obj?.prop`, `arr?.[0]`) - Foundation complete, integration pending
- Call chaining (`api.fetch().process()`) - Foundation complete, integration pending
- Full Pratt parser integration with Chevrotain statement parser

#### Language Features (Planned)
- Type system (Phase 1.2)
- Classes and inheritance
- Destructuring
- Spread operator
- Async generators

### 🔧 Breaking Changes

None - this is the first public release.

### 🐛 Bug Fixes

- Fixed TypeScript class field initialization order in `Computed` class
- Fixed getter/setter inheritance in reactive runtime
- Resolved dependency tracking in computed values
- Corrected WebSocket connection management

### 🏗️ Technical Details

#### Architecture
- **Lexer**: Chevrotain-based tokenization (165 LOC)
- **Parser**: Hybrid Chevrotain + Pratt parser (547 LOC Pratt core)
- **AST**: Type-safe node definitions with full TypeScript support
- **Codegen**: JavaScript code generation with Prettier formatting
- **Runtime**: VM-based sandboxed execution
- **Reactive System**: Signal-based reactivity (~100 LOC)

#### Dependencies
- `chevrotain`: Parser combinator library
- `prettier`: Code formatting
- `chokidar`: File watching for hot reload
- `commander`: CLI framework
- `vitest`: Testing framework

### 📦 Package Information

```json
{
  "name": "nusalang",
  "version": "1.0.0-alpha",
  "description": "Modern programming language with reactive runtime and full-stack capabilities"
}
```

### 🚀 What's Next

#### Phase 1.1 - Parser Integration
- Complete Pratt parser integration
- Enable optional chaining throughout
- Full member expression support

#### Phase 1.2 - Type System
- Optional type annotations
- Type inference
- Runtime type checking
- LSP integration for editor support

#### Phase 1.3 - Standard Library
- Complete `std/` modules
- HTTP client
- File system operations
- Cryptography utilities

### 🙏 Acknowledgments

Built with inspiration from:
- **Solid.js** - Reactive primitives design
- **Chevrotain** - Parser architecture
- **TypeScript** - Type safety and tooling
- **Deno** - Runtime security model

---

## Previous Releases

### [0.9.0-alpha] - 2025-10-27
- Added reactive runtime with signals and computed values
- Implemented WebSocket streaming
- 22 new reactive runtime tests

### [0.8.0-bridge-ready] - 2025-10-27
- Created parser bridge layer
- Prepared Pratt/Chevrotain integration
- 174 tests passing with zero regressions

### [0.7.0-foundation] - 2025-10-27
- Added optional chaining foundation (lexer, AST, codegen)
- Implemented Pratt parser enhancements
- 29 new tests for Phase 0.7 features

### [0.6.0-alpha] - 2025-10-27
- Implemented array and object literals
- Created Pratt parser (465 LOC)
- 174 tests passing

### [0.5.0-alpha] - 2025-10-27
- Added template literals with interpolation
- Implemented `.nusarc` configuration system
- 154 tests passing

### [0.4.0-alpha] - 2025-10-27
- Added `@route` annotations for HTTP routing
- Implemented hot reload with `--watch`
- Database persistence with JSON adapter

### [0.3.0-alpha] - 2025-10-27
- Built-in HTTP server with `nusa dev`
- UI rendering system
- Auto-routing for pages and APIs

### [0.2.0-alpha] - 2025-10-27
- Runtime execution foundation
- Page declarations
- Mock database and router

### [0.1.0] - 2025-10-27
- Initial compiler implementation
- Functions, variables, imports
- Pipeline operator
- Basic binary expressions

---

## Legend

- ✨ **Added**: New features
- 🔧 **Changed**: Changes to existing functionality
- 🐛 **Fixed**: Bug fixes
- 🗑️ **Removed**: Removed features
- 🏗️ **Technical**: Internal/architectural changes
- 📚 **Docs**: Documentation updates
- 🧪 **Tests**: Test additions or changes

---

For more details on each phase, see the individual `PHASE_X.X_SUMMARY.md` files in the repository root.

