# 🚀 NusaLang

**NusaLang** is a modern programming language designed to make SaaS, AI, and data-heavy applications simpler and more elegant than traditional approaches. 

**Current Version: Phase 0.2 (v0.2.0-alpha)** - A TypeScript-based compiler with runtime execution, page routing, and declarative data loading.

## ✨ Features

### Phase 0.2 (v0.2.0-alpha) - Runtime & Foundation ⚡
- ✅ **Runtime Execution**: Compile and run `.nusa` files with `nusa run`
- ✅ **Page Declaration**: Declarative routing with `page "/path" { ... }`
- ✅ **Data Loading**: Async data fetching with `data varName = await expression`
- ✅ **Mock Database**: In-memory CRUD with fluent API
- ✅ **Router System**: Page registration and route matching
- ✅ **Standard Library**: http, json, ui utility stubs

### Phase 0.1 - Compiler Foundation
NusaLang Phase 0.1/0.2 supports:

- ✅ **Functions**: Clean `fn` syntax for declaring functions
- ✅ **Variables**: `let` and `const` declarations
- ✅ **Imports**: ES6-style module imports
- ✅ **Async/Await**: First-class async function support
- ✅ **Pipeline Operator** (`|>`): Elegant data transformations
- ✅ **API Annotations** (`@api`): Mark functions as API endpoints
- ✅ **Binary Expressions**: Standard arithmetic and comparison operators

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

### Runtime Example (Phase 0.2)

Create a file `myapp.nusa`:

```nusa
page "/home" {
  let greeting = "Hello from NusaLang!";
  return greeting;
}

page "/api/status" {
  data config = await loadConfig();
  return config;
}

async fn loadConfig() {
  return 42;
}
```

Run it:

```bash
node dist/cli.js run myapp.nusa
```

### Compiler Example (Phase 0.1)

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

### Phase 0.2 Commands

```bash
# Run a .nusa file (compile + execute)
node dist/cli.js run <input.nusa>

# Run with debug output
node dist/cli.js run <input.nusa> --debug

# Compile to JavaScript
node dist/cli.js compile <input.nusa> [output.js]

# Compile with watch mode
node dist/cli.js compile <input.nusa> --watch
```

### Command Reference

**`nusa run`** - Compile and execute
- `--debug` - Show compilation and execution details
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

**Phase 0.2 Examples (with Runtime)**
- **`hello_page.nusa`** - Page declarations and routing
- **`dashboard.nusa`** - Data loading with async
- **`db_query.nusa`** - Database operations and pages

**Phase 0.1 Examples (Compilation)**
- **`basic.nusa`** - Functions, variables, and expressions
- **`async-await.nusa`** - Async functions and await expressions
- **`pipeline.nusa`** - Pipeline operator for data transformation
- **`api-endpoint.nusa`** - API annotations
- **`complete.nusa`** - All features combined

Run Phase 0.2 examples:

```bash
npm run build

# Run Phase 0.2 examples
node dist/cli.js run examples/hello_page.nusa
node dist/cli.js run examples/dashboard.nusa
node dist/cli.js run examples/db_query.nusa

# Compile Phase 0.1 examples
node dist/cli.js compile examples/basic.nusa
node dist/cli.js compile examples/async-await.nusa
node dist/cli.js compile examples/pipeline.nusa
```

## 🧪 Testing

The project includes a comprehensive test suite with **59 tests**:

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
- **Runtime**: Execution and sandboxing (9 tests) ⭐ NEW
- **Database**: CRUD operations (9 tests) ⭐ NEW
- **Router**: Page routing and matching (9 tests) ⭐ NEW

**Status: 59/59 passing (100%)**

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

### Phase 0.2 (Current - v0.2.0-alpha) ✅
- Runtime execution with `nusa run`
- Page declarations and routing
- Data loading keyword
- Mock database with CRUD
- Router system
- Standard library foundation
- 59 passing tests

### Phase 0.3 (Next - 2-3 weeks)
- Member expressions (`object.property`)
- UI block rendering (HTML/JSX)
- Real HTTP server (Express/Fastify)
- Database integration (PostgreSQL/SQLite)
- Hot reload and source maps
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

**Phase 0.2 Limitations:**
- No member expressions (`.` operator) - Phase 0.3
- No UI block rendering - Phase 0.3
- No HTTP server for pages - Phase 0.3
- No array/object literals - Phase 0.3
- No template literals - Phase 0.3
- Mock database only (no persistence) - Phase 0.3
- `data` is now a reserved keyword

**Note:** All Phase 0.1 features remain fully functional.

## 🙏 Acknowledgments

Built with:
- [Chevrotain](https://github.com/Chevrotain/chevrotain) - Parser toolkit
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [Prettier](https://prettier.io/) - Code formatter
- [Vitest](https://vitest.dev/) - Testing framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development

---

**Made with ❤️ for building better SaaS applications**

