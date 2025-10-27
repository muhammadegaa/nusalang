#!/usr/bin/env node

/**
 * NusaLang CLI
 * Command-line interface for the NusaLang compiler
 */

import { Command } from 'commander';
import * as fs from 'fs';
import { compile } from './compiler.js';
import { execute } from './runtime/execute.js';

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

program.parse();

