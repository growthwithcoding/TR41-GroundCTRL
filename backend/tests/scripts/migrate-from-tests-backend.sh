#!/bin/bash

# Migration script for moving from tests-backend to tests
# Usage: bash tests/scripts/migrate-from-tests-backend.sh

echo "🚀 Migrating from tests-backend to tests..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
  echo "❌ Please run this from the backend directory"
  exit 1
fi

# Check if tests-backend exists
if [ ! -d "tests-backend" ]; then
  echo "✅ tests-backend doesn't exist - already migrated!"
  exit 0
fi

# Remove tests-backend directory
echo "🗑️  Removing tests-backend directory..."
rm -rf tests-backend

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm test' to verify tests work"
echo "2. Run 'npm run lint' to check code style"
echo "3. Commit the changes"
