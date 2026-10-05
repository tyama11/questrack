const fs = require('fs');
const path = require('path');

// TypeScript 7.0 (Go compiler) uses a modern native engine without the legacy JS Compiler API.
// To allow typescript-eslint to perform AST linting side-by-side with TS 7.0 builds,
// this script redirects typescript-eslint's internal typescript imports
// to the official @typescript/typescript6 compatibility package.
const rootDir = path.resolve(__dirname, '..');
const dirsToPatch = [
  path.join(rootDir, 'node_modules/typescript-eslint'),
  path.join(rootDir, 'node_modules/@typescript-eslint'),
];

function patchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') {
        patchDir(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      if (content.includes('require("typescript")') || content.includes("require('typescript')")) {
        content = content
          .replace(/require\("typescript"\)/g, 'require("@typescript/typescript6")')
          .replace(/require\('typescript'\)/g, "require('@typescript/typescript6')");
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[setup-ts-compat] Patched: ${path.relative(rootDir, fullPath)}`);
      }
    }
  }
}

for (const dir of dirsToPatch) {
  patchDir(dir);
}
