#!/usr/bin/env bash
set -euo pipefail

PACKAGE_PATH="./dist/ez-vid-ang"

# Ensure tag argument is provided
if [ $# -eq 0 ]; then
  echo "❌ Usage: ./release.sh <tag>"
  echo "Example: ./release.sh v19"
  exit 1
fi

TAG="$1"

echo "🧹 Cleaning..."
rm -rf .angular node_modules dist

echo "📦 Installing..."
npm i

echo "🏗 Building..."
npm run buildProd

echo "🔎 Verifying version inside dist..."
cat "$PACKAGE_PATH/package.json" | grep version

echo "📦 Moving README.md"
cp README.md dist/ez-vid-ang/README.md && cp LICENSE dist/ez-vid-ang/LICENSE

echo "📤 Publishing to npm with tag: $TAG"
npm publish "$PACKAGE_PATH" --tag $TAG

echo "🎉 Release successful with tag $TAG"