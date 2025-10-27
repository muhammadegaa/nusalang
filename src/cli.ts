#!/usr/bin/env node

/**
 * NusaLang CLI
 * Command-line interface for the NusaLang compiler
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { compile } from './compiler.js';
import { execute } from './runtime/execute.js';
import { startDevServer } from './runtime/server.js';
import { router } from './runtime/router.js';

const program = new Command();

program
  .name('nusa')
  .description('NusaLang compiler and runtime')
  .version('0.2.0');

// Compile command
program
  .command('compile')
  .description('Compile .nusa files to JavaScript')
  .argument('<input>', 'Input .nusa file to compile')
  .argument('[output]', 'Output .js file (optional, defaults to input name with .js extension)')
  .option('-d, --debug', 'Enable debug output')
  .option('-w, --watch', 'Watch file for changes and recompile')
  .action((inputFile: string, outputFile: string | undefined, options: any) => {
    compileFile(inputFile, outputFile, options);

    if (options.watch) {
      console.log(`\n👀 Watching ${inputFile} for changes...`);
      fs.watchFile(inputFile, { interval: 1000 }, () => {
        console.log('\n♻️  File changed, recompiling...');
        compileFile(inputFile, outputFile, options);
      });
    }
  });

// Run command
program
  .command('run')
  .description('Compile and execute a .nusa file')
  .argument('<input>', 'Input .nusa file to run')
  .option('-d, --debug', 'Enable debug output')
  .option('--no-db', 'Disable database module')
  .option('--no-router', 'Disable router module')
  .action(async (inputFile: string, options: any) => {
    await runFile(inputFile, options);
  });

// Dev server command
program
  .command('dev')
  .description('Start development server with hot reload')
  .argument('[input]', 'Input .nusa file to serve (optional)')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-H, --host <host>', 'Host address', 'localhost')
  .option('--no-reload', 'Disable hot reload')
  .option('--watch', 'Enable file watching (hot reload)')
  .action(async (inputFile: string | undefined, options: any) => {
    const port = parseInt(options.port, 10);
    const host = options.host;
    const watchEnabled = options.watch || options.reload !== false;
    
    console.log('🚀 Starting NusaLang development server...\n');
    
    // Load application
    async function loadApp() {
      if (inputFile) {
        try {
          console.log(`📦 ${watchEnabled ? 'Reloading' : 'Loading'} ${inputFile}...`);
          const source = fs.readFileSync(inputFile, 'utf-8');
          const result = await compile(source);
          
          if (!result.success) {
            console.error('❌ Compilation failed:', result.errors);
            return false;
          }
          
          // Clear existing routes before reloading
          router.clear();
          
          // Execute to register pages/routes
          await execute(result.code!, {
            enableRouter: true,
            enableDb: true,
          });
          
          console.log(`✅ Application ${watchEnabled ? 'reloaded' : 'loaded'} at ${new Date().toLocaleTimeString()}\n`);
          return true;
        } catch (error) {
          console.error('❌ Error loading application:', (error as Error).message);
          return false;
        }
      }
      return true;
    }
    
    // Initial load
    const loaded = await loadApp();
    if (!loaded && inputFile) {
      process.exit(1);
    }
    
    const server = await startDevServer({
      port,
      host,
      hotReload: watchEnabled,
    });
    
    // Setup file watcher for hot reload
    if (watchEnabled && inputFile) {
      console.log(`👀 Watching ${inputFile} for changes...\n`);
      
      const watcher = chokidar.watch(inputFile, {
        persistent: true,
        ignoreInitial: true,
      });
      
      watcher.on('change', async (path) => {
        console.log(`\n♻️  File changed: ${path}`);
        await loadApp();
      });
      
      watcher.on('error', (error) => {
        console.error('❌ Watcher error:', error);
      });
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
  });

// Build command
program
  .command('build')
  .description('Build static output from .nusa files')
  .argument('[input]', 'Input .nusa file or directory')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .option('--html', 'Generate static HTML files')
  .action(async (inputPath: string | undefined, options: any) => {
    console.log('🔨 Building NusaLang project...\n');
    
    const outputDir = options.output;
    const input = inputPath || '.';
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // Find all .nusa files
      const files = findNusaFiles(input);
      
      console.log(`📦 Found ${files.length} file(s) to compile\n`);
      
      for (const file of files) {
        console.log(`  ⚙️  Compiling ${file}...`);
        
        const source = fs.readFileSync(file, 'utf-8');
        const result = await compile(source);
        
        if (!result.success) {
          console.error(`    ❌ Failed: ${result.errors}`);
          continue;
        }
        
        // Write compiled JS
        const baseName = path.basename(file, '.nusa');
        const jsPath = path.join(outputDir, `${baseName}.js`);
        fs.writeFileSync(jsPath, result.code!);
        
        console.log(`    ✅ Generated ${jsPath}`);
      }
      
      console.log(`\n✅ Build complete! Output in ${outputDir}/`);
    } catch (error) {
      console.error('❌ Build failed:', (error as Error).message);
      process.exit(1);
    }
  });

// Default command (for backward compatibility)
program
  .argument('[input]', 'Input .nusa file to compile')
  .argument('[output]', 'Output .js file')
  .option('-d, --debug', 'Enable debug output')
  .option('-w, --watch', 'Watch file for changes')
  .action((inputFile: string, outputFile: string | undefined, options: any) => {
    if (inputFile) {
      compileFile(inputFile, outputFile, options);

      if (options.watch) {
        console.log(`\n👀 Watching ${inputFile} for changes...`);
        fs.watchFile(inputFile, { interval: 1000 }, () => {
          console.log('\n♻️  File changed, recompiling...');
          compileFile(inputFile, outputFile, options);
        });
      }
    }
  });

async function compileFile(inputFile: string, outputFile: string | undefined, options: any) {
  try {
    // Read input file
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Error: Input file '${inputFile}' not found`);
      process.exit(1);
    }

    const sourceCode = fs.readFileSync(inputFile, 'utf-8');

    // Compile
    console.log(`🔨 Compiling ${inputFile}...`);
    const result = await compile(sourceCode, {
      sourceFile: inputFile,
      debug: options.debug,
    });

    if (!result.success) {
      console.error('❌ Compilation failed:');
      result.errors?.forEach((err) => console.error(`  ${err}`));
      process.exit(1);
    }

    // Determine output file
    const output = outputFile || inputFile.replace(/\.nusa$/, '.js');

    // Write output
    fs.writeFileSync(output, result.code, 'utf-8');

    console.log(`✅ Successfully compiled to ${output}`);

    if (options.debug && result.ast) {
      console.log('\n📊 AST:', JSON.stringify(result.ast, null, 2));
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function runFile(inputFile: string, options: any) {
  try {
    // Check if file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Error: Input file '${inputFile}' not found`);
      process.exit(1);
    }

    const sourceCode = fs.readFileSync(inputFile, 'utf-8');

    // Compile
    console.log(`🔨 Compiling ${inputFile}...`);
    const compileResult = await compile(sourceCode, {
      sourceFile: inputFile,
      debug: options.debug,
    });

    if (!compileResult.success) {
      console.error('❌ Compilation failed:');
      compileResult.errors?.forEach((err) => console.error(`  ${err}`));
      process.exit(1);
    }

    if (options.debug) {
      console.log('✅ Compilation successful\n');
      console.log('📊 Generated code:');
      console.log(compileResult.code);
      console.log('');
    }

    // Execute
    console.log(`▶️  Executing ${inputFile}...`);
    const executeResult = await execute(compileResult.code, {
      enableDb: options.db !== false,
      enableRouter: options.router !== false,
    });

    if (!executeResult.success) {
      console.error('❌ Execution failed:');
      console.error(`  ${executeResult.error?.message}`);
      if (options.debug && executeResult.error?.stack) {
        console.error(executeResult.error.stack);
      }
      process.exit(1);
    }

    console.log('✅ Execution completed successfully');
    
    if (executeResult.result !== undefined) {
      console.log('\n📤 Result:', executeResult.result);
    }

    if (options.debug && executeResult.exports) {
      console.log('\n📦 Exports:', Object.keys(executeResult.exports));
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

/**
 * Find all .nusa files in a directory or return single file
 */
function findNusaFiles(inputPath: string): string[] {
  const stat = fs.statSync(inputPath);
  
  if (stat.isFile()) {
    return [inputPath];
  }
  
  if (stat.isDirectory()) {
    const files: string[] = [];
    const entries = fs.readdirSync(inputPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(inputPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...findNusaFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.nusa')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  return [];
}

program.parse();

