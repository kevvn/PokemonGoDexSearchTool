import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

function collectFiles(dir, predicate) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath, entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getSourceFiles(subdir = '') {
  const targetDir = subdir ? path.join(SRC_DIR, subdir) : SRC_DIR;
  return collectFiles(
    targetDir,
    (_fullPath, name) => /\.(js|jsx)$/.test(name) && !/\.test\.(js|jsx)$/.test(name)
  );
}

function stripComments(sourceCode) {
  return sourceCode.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function extractImportSpecifiers(sourceCode) {
  const cleaned = stripComments(sourceCode);
  const specs = [];
  const staticImportRe = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of cleaned.matchAll(staticImportRe)) specs.push(match[1]);
  for (const match of cleaned.matchAll(dynamicImportRe)) specs.push(match[1]);
  return specs;
}

function resolveTargetLayer(fromFile, specifier) {
  if (!specifier.startsWith('.')) {
    return { isPackage: true, layer: specifier };
  }
  const resolved = path.resolve(path.dirname(fromFile), specifier);
  const relFromSrc = path.relative(SRC_DIR, resolved);
  if (relFromSrc.startsWith('..')) {
    return { isPackage: false, layer: 'outside-src' };
  }
  return { isPackage: false, layer: relFromSrc.split(path.sep)[0] };
}

describe('Architecture fitness & MVC boundary guardrails', () => {
  test('enforces strict acyclic MVC layer import boundaries across src/', () => {
    const forbiddenByLayer = {
      data: {
        layers: new Set(['models', 'services', 'controllers', 'views']),
        packages: new Set(['react', 'react-dom']),
      },
      models: {
        layers: new Set(['services', 'controllers', 'views']),
        packages: new Set(['react', 'react-dom']),
      },
      services: {
        layers: new Set(['controllers', 'views']),
        packages: new Set(['react', 'react-dom']),
      },
      controllers: {
        layers: new Set(['views']),
        packages: new Set([]),
      },
      views: {
        layers: new Set(['services']),
        packages: new Set([]),
      },
    };

    const violations = [];

    for (const [layer, rules] of Object.entries(forbiddenByLayer)) {
      for (const filePath of getSourceFiles(layer)) {
        const relFile = path.relative(ROOT_DIR, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        for (const spec of extractImportSpecifiers(content)) {
          const target = resolveTargetLayer(filePath, spec);
          if (target.isPackage) {
            if (rules.packages.has(target.layer)) {
              violations.push(`${relFile} imports forbidden package "${spec}" in layer "${layer}"`);
            }
          } else if (rules.layers.has(target.layer)) {
            violations.push(`${relFile} imports forbidden layer "${target.layer}" via "${spec}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test('enforces zero useEffect / useLayoutEffect usages across all src/ production files', () => {
    const violations = [];
    for (const filePath of getSourceFiles()) {
      const code = stripComments(fs.readFileSync(filePath, 'utf8'));
      if (/\b(?:useEffect|useLayoutEffect)\b/.test(code)) {
        violations.push(path.relative(ROOT_DIR, filePath));
      }
    }
    expect(violations).toEqual([]);
  });

  test('forbids external CDN runtime imports (esm.sh, unpkg, jsdelivr) in src/ for offline PWA reliability', () => {
    const cdnRe = /https?:\/\/(?:esm\.sh|unpkg\.com|cdn\.jsdelivr\.net|cdn\.skypack\.dev)/i;
    const violations = [];
    for (const filePath of getSourceFiles()) {
      const code = stripComments(fs.readFileSync(filePath, 'utf8'));
      if (cdnRe.test(code)) {
        violations.push(path.relative(ROOT_DIR, filePath));
      }
    }
    expect(violations).toEqual([]);
  });

  test('forbids hardcoded 1025 Dex ceilings outside speciesConstants and hardcoded 2023–2026 year arrays', () => {
    const dexCeilingViolations = [];
    const yearArrayViolations = [];

    for (const layer of ['models', 'controllers', 'views']) {
      for (const filePath of getSourceFiles(layer)) {
        const relFile = path.relative(ROOT_DIR, filePath);
        const code = stripComments(fs.readFileSync(filePath, 'utf8'));
        if (/\b1025\b/.test(code)) {
          dexCeilingViolations.push(relFile);
        }
        if (/\[\s*202\d\s*,\s*202\d\s*,\s*202\d/.test(code)) {
          yearArrayViolations.push(relFile);
        }
      }
    }

    expect(dexCeilingViolations).toEqual([]);
    expect(yearArrayViolations).toEqual([]);
  });

  test('preserves offline PWA, CORS-safe sprite caching, and devDependencies invariants', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    expect(pkg.dependencies?.['vite-plugin-pwa']).toBeUndefined();
    expect(pkg.devDependencies?.['vite-plugin-pwa']).toBeDefined();
    expect(pkg.dependencies?.qrcode).toBeDefined();

    const viteConfig = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.js'), 'utf8');
    expect(viteConfig).toMatch(/cacheName:\s*['"]pokemon-sprites['"]/);
    expect(viteConfig).not.toMatch(/statuses:\s*\[\s*0\b/);
    expect(viteConfig).toMatch(/pvpoke[\s\S]*?handler:\s*['"]NetworkOnly['"]/);

    const spriteView = fs.readFileSync(
      path.join(SRC_DIR, 'views', 'shared', 'PokemonSprite.jsx'),
      'utf8'
    );
    expect(spriteView).toContain('crossOrigin="anonymous"');
  });
});
