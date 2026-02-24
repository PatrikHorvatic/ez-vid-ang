#!/usr/bin/env bash
set -euo pipefail

PACKAGE_PATH="./dist/ez-vid-ang"

echo "🧹 Cleaning..."
rm -rf .angular node_modules dist

echo "📦 Installing..."
npm i

echo "🏗 Building..."
npm run buildProd

echo "🔎 Verifying version inside dist..."
cat "$PACKAGE_PATH/package.json" | grep version

echo "Moving README.md"
cp README.md dist/ez-vid-ang/README.md && cp LICENSE dist/ez-vid-ang/LICENSE

echo "📤 Publishing to npm..."
npm publish "$PACKAGE_PATH"

echo "🎉 Release successful."