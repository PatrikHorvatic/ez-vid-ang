#!/usr/bin/env bash
set -euo pipefail

rm -rf .angular node_modules dist
npm i

npm run buildProd
npm version patch
npm publish ./dist/ez-vid-ang
