# 🚀 NusaLang

**NusaLang** is a modern programming language designed to make SaaS, AI, and data-heavy applications simpler and more elegant than traditional approaches. 

**Current Version: v1.0.0-alpha** 🎉 - First public release! Stable compiler, reactive runtime, and comprehensive documentation.

> **Phase 1.1 Update**: Parser integration investigation complete. Full Pratt/Chevrotain merge deferred to Phase 1.2 (requires Chevrotain grammar refactor). See `PHASE_1.1_STATUS.md` for details.

[![Tests](https://img.shields.io/badge/tests-193%20passing-brightgreen)](https://github.com/muhammadegaa/nusalang)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0--alpha-orange)](https://github.com/muhammadegaa/nusalang/releases)

## ✨ Features

### Phase 0.9 - Reactive Runtime & Live Data 🔄
- ✅ **Signals**: Reactive state with `signal()` - auto-notify subscribers
- ✅ **Computed Values**: Derived state with `computed()` - auto-updates
- ✅ **WebSocket Streaming**: Real-time data with `subscribe()` and `publish()`
- ✅ **22 Tests Passing**: New reactive runtime fully tested
- ✅ **Runtime Integration**: All reactive primitives available in NusaLang code
- ✅ **Examples**: `reactive_simple.nusa`, `reactive_computed.nusa`

### Phase 0.8-Bridge (v0.8.0-bridge-ready) - Parser Bridge Layer 🌉
- ✅ **Parser Bridge**: Complete CST-to-Pratt token bridge (`bridge.ts`)
- ✅ **Integration Started**: Pratt parser wired into main parser
- ✅ **174 Tests Passing**: Zero regressions, full backward compatibility
- ✅ **29 Tests Ready**: Optional chaining & call chaining tests written
- ✅ **Clear Roadmap**: 6-8 hour Chevrotain refactor documented
- ⏸️ **Deep Integration**: Requires permissive Chevrotain expression rule
- 📝 **Status**: Bridge ready, awaiting dedicated integration session

### Phase 0.7 - Foundation
- ✅ **Lexer Tokens**: `?.` (OptionalDot) and `?[` (OptionalBracket) operators
- ✅ **Pratt Parser Enhancement**: Full optional chaining & call chaining support
- ✅ **AST Nodes**: `OptionalMemberExpressionNode` with proper typing
- ✅ **Code Generation**: Generates correct `obj?.prop` and `arr?.[0]` JavaScript

### Phase 0.6 - Arrays & Objects
- ✅ **Array Literals**: `[1, 2, 3]`, `[[nested]]`, array indexing `arr[0]`
- ✅ **Object Literals**: `{name: "Alice", age: 27}`, nested objects
- ✅ **Pratt Parser**: 465 LOC expression parser with proper precedence
- ✅ **174 Tests Passing**: Zero regressions

### Phase 0.5 - Template Literals & Configuration
- ✅ **Template Literals**: Full support for `` `Hello, ${name}!` `` with interpolation
- ✅ **`.nusarc` Configuration**: Project-level config file with validation
- ✅ **Config Runtime Access**: Use `config.port`, `config.db` in your code

### Phase 0.4 - Developer Experience & Routing
- ✅ **@route Annotations**: Declarative HTTP routing with `@route("/path")`
- ✅ **Hot Reload**: Automatic recompilation on file changes with `--watch`
- ✅ **Database Persistence**: JSON file-based storage with adapters

### Phase 0.3 - HTTP Server & UI Platform
- ✅ HTTP Server with `nusa dev`, UI Rendering, Build System
- ✅ Auto-routing, JSON APIs, Example Apps

### Phase 0.2 - Runtime Foundation
- ✅ Runtime execution, page declarations, data loading
- ✅ Mock database, router system, standard library

### Phase 0.1 - Compiler Foundation
- ✅ Functions, Variables, Imports, Async/Await
- ✅ Pipeline Operator (`|>`), API Annotations (`@api`)
- ✅ Binary Expressions, Arithmetic and comparison operators

## 📦 Installation

```bash
# Clone the repository
git clone <repo-url>
cd nusalang

# Install dependencies
npm install

# Build the compiler
npm run build

# Run tests
npm test
```

## 🎯 Quick Start

### Phase 0.9 Example - Reactive State

```nusa
// reactive_simple.nusa
fn main() {
  // Create reactive signal
  let count = signal(0)
  
  // Subscribe to changes
  count.subscribe(fn() {
    print(`Count: ${count.value}`)
  })
  
  // Updates trigger subscribers
  count.value = 5  // Prints: "Count: 5"
  count.value = 10 // Prints: "Count: 10"
}

main()
```

```bash
# Run with NusaLang
node dist/cli.js run examples/reactive_simple.nusa
```

### Phase 0.5 Example - Template Literals & Config

Create a file `.nusarc`:

```json
{
  "port": 4000,
  "db": "sqlite",
  "hotReload": true,
  "logLevel": "info"
}
```

Create a file `app.nusa`:

```nusa
fn greet(name, age) {
  let message = `Hello, ${name}! You are ${age} years old.`;
  return message;
}

page "/demo" {
  let greeting = greet("Alice", 27);
  let appInfo = `Running on port ${config.port} with ${config.db} database`;
  
  ui {
    <div>
      <h1>Phase 0.5 Demo</h1>
      <p>{greeting}</p>
      <p>{appInfo}</p>
    </div>
  }
}
```

Run it:

```bash
node dist/cli.js dev app.nusa --config .nusarc
```

### Runtime Example (Phase 0.2)

Create a file `hello.nusa`:

```nusa
fn greet(name) {
  return "Hello";
}

fn main() {
  let message = greet("World");
  return message;
}
```

Compile it:

```bash
node dist/cli.js hello.nusa
# or
npm run cli hello.nusa
```

This generates `hello.js`:

```javascript
function greet(name) {
  return 'Hello';
}
function main() {
  let message = greet('World');
  return message;
}
```

## 📖 Language Syntax

### Page Declarations (Phase 0.2)

```nusa
page "/dashboard" {
  let userCount = 1500;
  return userCount;
}

page "/users/:id" {
  data user = await getUser(id);
  return user;
}
```

### Data Loading (Phase 0.2)

```nusa
data users = await fetchUsers();
data config = await loadConfig();
```

Data declarations:
- Automatically awaited
- Available in page scope
- Compile to `const varName = await expression`

### Functions

```nusa
// Basic function
fn add(x, y) {
  return x + y;
}

// Async function
async fn fetchData(url) {
  let result = await getData(url);
  return result;
}
```

### Variables

```nusa
let mutableValue = 42;
const immutableValue = "constant";
```

### Imports

```nusa
import { module1, module2 } from "package"
```

### Pipeline Operator

Transform data elegantly with the pipeline operator `|>`:

```nusa
fn processText(input) {
  return input |> trim |> uppercase |> addExclamation;
}

// Compiles to:
// return addExclamation(uppercase(trim(input)));
```

Pipelines with arguments:

```nusa
fn calculate(value) {
  return value |> multiply(2) |> add(10);
}

// Compiles to:
// return add(multiply(value, 2), 10);
```

### API Annotations

Mark functions as API endpoints:

```nusa
@api
async fn getUser(id) {
  let user = await findUser(id);
  return user;
}
```

The `@api` annotation is preserved as a comment in the generated JavaScript for future tooling integration.

### Binary Expressions

```nusa
let result = 5 + 10;
let comparison = x > y;
let calculation = a * b + c / d;
```

## 📁 Project Structure

```
nusalang/
├── src/
│   ├── ast.ts          # AST node type definitions
│   ├── lexer.ts        # Tokenizer using Chevrotain
│   ├── parser.ts       # Parser and CST-to-AST converter
│   ├── codegen.ts      # JavaScript code generator
│   ├── compiler.ts     # Main compiler orchestration
│   ├── cli.ts          # Command-line interface
│   ├── index.ts        # Public API
│   └── __tests__/      # Comprehensive test suite
├── examples/           # Example .nusa files
├── dist/               # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ CLI Usage

### Phase 0.3 Commands

```bash
# Start development server (NEW!)
node dist/cli.js dev [input.nusa] -p 3000

# Build static files (NEW!)
node dist/cli.js build [path] -o dist

# Run a .nusa file (compile + execute)
node dist/cli.js run <input.nusa>

# Compile to JavaScript
node dist/cli.js compile <input.nusa> [output.js]
```

### Command Reference

**`nusa dev`** - Start development server ⭐ NEW
- `[input]` - Optional .nusa file to load
- `-p, --port <port>` - Port number (default: 3000)
- `-H, --host <host>` - Host address (default: localhost)
- `--no-reload` - Disable hot reload

**`nusa build`** - Build static output ⭐ NEW
- `[input]` - Input file or directory (default: current directory)
- `-o, --output <dir>` - Output directory (default: ./dist)
- `--html` - Generate static HTML files

**`nusa run`** - Compile and execute
- `--debug` - Show compilation details
- `--no-db` - Disable database module
- `--no-router` - Disable router module

**`nusa compile`** - Transpile to JavaScript  
- `-d, --debug` - Enable debug output including AST
- `-w, --watch` - Watch file for changes and recompile

**Options**
- `-V, --version` - Output version number
- `-h, --help` - Display help information

## 📝 Examples

Check out the `examples/` directory for complete examples:

**Phase 0.3 Examples (HTTP Server)** ⭐ NEW
- **`blog.nusa`** - Blog with pages and data loading
- **`dashboard_http.nusa`** - Dashboard served over HTTP
- **`api_demo.nusa`** - API endpoints demonstration

**Phase 0.2 Examples (Runtime)**
- **`hello_page.nusa`** - Page declarations and routing
- **`dashboard.nusa`** - Data loading with async
- **`db_query.nusa`** - Database operations

**Phase 0.1 Examples (Compilation)**
- **`basic.nusa`** - Functions, variables, and expressions
- **`async-await.nusa`** - Async functions and await expressions
- **`pipeline.nusa`** - Pipeline operator for data transformation
- **`api-endpoint.nusa`** - API annotations
- **`complete.nusa`** - All features combined

Run examples:

```bash
npm run build

# Start HTTP server with Phase 0.3 examples
node dist/cli.js dev examples/blog.nusa
node dist/cli.js dev examples/dashboard_http.nusa -p 8080
node dist/cli.js dev examples/api_demo.nusa

# Run Phase 0.2 examples
node dist/cli.js run examples/hello_page.nusa
node dist/cli.js run examples/dashboard.nusa

# Build all examples
node dist/cli.js build examples/ -o dist/examples
```

## 🧪 Testing

The project includes a comprehensive test suite with **71 tests**:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- lexer.test.ts
```

Test coverage includes:
- **Lexer**: Token recognition and error handling (7 tests)
- **Parser**: Syntax parsing and AST generation (8 tests)
- **Code Generator**: JavaScript output correctness (9 tests)
- **Compiler**: End-to-end integration tests (8 tests)
- **Runtime**: Execution and sandboxing (9 tests)
- **Database**: CRUD operations (9 tests)
- **Router**: Page routing and matching (9 tests)
- **UI Renderer**: HTML generation (6 tests) ⭐ NEW
- **HTTP Server**: Web server functionality (6 tests) ⭐ NEW

**Status: 71/71 passing (100%)**

## 🏗️ Architecture

NusaLang Phase 0.1 follows a classic compiler architecture:

1. **Lexer** (`lexer.ts`) - Tokenizes source code using Chevrotain
2. **Parser** (`parser.ts`) - Builds Concrete Syntax Tree (CST) and converts to AST
3. **Code Generator** (`codegen.ts`) - Traverses AST and generates JavaScript
4. **Compiler** (`compiler.ts`) - Orchestrates the compilation pipeline
5. **CLI** (`cli.ts`) - Provides command-line interface

### Pipeline Flow

```
.nusa source → Lexer → Tokens → Parser → AST → Codegen → .js output
```

## 🎨 Code Generation

NusaLang generates clean, readable JavaScript:

- **Functions**: `fn` → `function`
- **Async/Await**: Preserved as-is
- **Pipelines**: Transformed to nested function calls
- **Imports**: Converted to ES6 imports
- **Annotations**: Preserved as comments
- **Formatting**: Output is automatically formatted with Prettier

## 🔧 Development

```bash
# Install dependencies
npm install

# Build in watch mode
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## 🗺️ Roadmap

### Phase 0.1 (Complete) ✅
- Basic transpilation (`fn`, `let`, `const`, `import`)
- Pipeline operator (`|>`)
- Async/await support
- `@api` annotations
- CLI tool
- Comprehensive tests

### Phase 0.2 (Complete) ✅
- Runtime execution with `nusa run`
- Page declarations and routing
- Data loading keyword
- Mock database with CRUD
- Router system
- Standard library foundation

### Phase 0.3 (Complete) ✅
- HTTP server with `nusa dev`
- UI rendering from AST nodes
- Build system with `nusa build`
- Auto-routing for pages
- JSON API responses

### Phase 0.4 (Complete) ✅
- `@route` annotations for declarative HTTP routing
- File watching / hot reload with `--watch`
- Database persistence (JSON file-based)
- Route auto-registration

### Phase 0.5 (Current - v0.5.0-alpha) ✅
- **Template Literals**: `` `Hello, ${name}!` `` with interpolation
- **`.nusarc` Configuration**: Project config file system
- **Config Runtime Access**: Use config in your NusaLang code
- **154 Tests**: Up from 142 in Phase 0.4
- **3 New Examples**: Template, config, and Phase 0.5 demos

### Phase 0.6 (Next - 2-3 weeks)
- Member expressions (`object.property`, `array[index]`)
- Array and object literals (`[1, 2, 3]`, `{key: value}`)
- Parser redesign for complex expressions
- WebSocket support
- Array and object literals
- Template literals

### Phase 1.0 (Future)
- Self-hosted compiler
- Native binary compilation
- Package manager
- Production deployment tools

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code is properly formatted (`npm run format`)
- New features include tests
- Code follows the existing architecture

## 🐛 Known Limitations

**Phase 0.3 Limitations:**
- No member expressions (`.` operator) - Phase 0.4
- No real database (mock only) - Phase 0.4
- No file watching / hot reload - Phase 0.4
- No array/object literals - Phase 0.4
- No template literals - Phase 0.4
- No `@route` annotations - Phase 0.4
- `data` is a reserved keyword

**Note:** All Phase 0.1 and 0.2 features remain fully functional.

## 🙏 Acknowledgments

Built with:
- [Chevrotain](https://github.com/Chevrotain/chevrotain) - Parser toolkit
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [Prettier](https://prettier.io/) - Code formatter
- [Vitest](https://vitest.dev/) - Testing framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development

---

**Made with ❤️ for building better SaaS applications**

