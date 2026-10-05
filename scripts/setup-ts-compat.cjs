const fs = require('fs');
const path = require('path');

// TypeScript 7.0 (Go compiler) uses a modern native engine without the legacy JS Compiler API.
// To allow typescript-eslint to perform AST linting side-by-side with TS 7.0 builds,
// this script mounts the official @typescript/typescript6 compatibility package
// into typescript-eslint's local node_modules hierarchy.
const ts6Path = path.resolve(__dirname, '../node_modules/@typescript/typescript6');
if (!fs.existsSync(ts6Path)) {
  process.exit(0);
}

const targets = [
  'node_modules/typescript-eslint/node_modules/typescript',
  'node_modules/@typescript-eslint/parser/node_modules/typescript',
  'node_modules/@typescript-eslint/type-utils/node_modules/typescript',
  'node_modules/@typescript-eslint/utils/node_modules/typescript',
];

for (const target of targets) {
  const dest = path.resolve(__dirname, '..', target);
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(ts6Path, dest, { recursive: true });
  } catch (err) {
    // Ignore any non-critical filesystem errors
  }
}
