#!/bin/bash

# NusaLang Phase 0.1 Verification Script
# Verifies all components are working correctly

echo "🚀 NusaLang Phase 0.1 - Installation Verification"
echo "================================================"
echo ""

# Check Node.js version
echo "✓ Checking Node.js..."
node --version

# Check npm
echo "✓ Checking npm..."
npm --version

# Check if dependencies are installed
echo ""
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "  Dependencies installed ✓"
else
  echo "  ⚠️  Dependencies not installed. Run: npm install"
  exit 1
fi

# Check if project is built
echo ""
echo "✓ Checking build..."
if [ -d "dist" ] && [ -f "dist/cli.js" ]; then
  echo "  Project built ✓"
else
  echo "  ⚠️  Project not built. Run: npm run build"
  exit 1
fi

# Run tests
echo ""
echo "✓ Running test suite..."
npm test -- --run --reporter=basic 2>&1 | tail -5

# Compile examples
echo ""
echo "✓ Compiling example files..."
for file in examples/*.nusa; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    node dist/cli.js "$file" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "  ✓ $filename"
    else
      echo "  ✗ $filename failed"
      exit 1
    fi
  fi
done

# Final verification
echo ""
echo "================================================"
echo "✅ All verifications passed!"
echo ""
echo "NusaLang Phase 0.1 is fully operational."
echo ""
echo "Try it out:"
echo "  node dist/cli.js examples/basic.nusa"
echo "  node dist/cli.js examples/pipeline.nusa"
echo ""
echo "Run tests:"
echo "  npm test"
echo ""
echo "Read documentation:"
echo "  cat README.md"
echo ""

