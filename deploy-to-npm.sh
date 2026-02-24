#!/usr/bin/env bash
set -euo pipefail

PACKAGE_PATH="./dist/ez-vid-ang"

echo "🧹 Cleaning..."
rm -rf .angular node_modules dist

echo "📦 Installing..."
npm ci

echo "🔢 Bumping version..."
npm version patch

echo "🏗 Building..."
npm run buildProd

echo "🔎 Verifying version inside dist..."
cat "$PACKAGE_PATH/package.json" | grep version

echo "📤 Publishing to npm..."
npm publish "$PACKAGE_PATH"

echo "🎉 Release successful."