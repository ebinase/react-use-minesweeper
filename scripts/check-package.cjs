const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, symlinkSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');

const packageName = '@ebinas/react-use-minesweeper';
const packageRoot = process.cwd();
const directory = mkdtempSync(join(tmpdir(), 'minesweeper-package-'));
const run = (command, args, cwd = directory) => {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } catch (error) {
    if (error.stdout) process.stderr.write(error.stdout);
    throw error;
  }
};
const node = (code) => run(process.execPath, ['--input-type=module', '-e', code]);

async function main() {
  const packed = JSON.parse(
    run(
      'npm',
      [
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        directory,
        '--cache',
        join(directory, 'cache'),
      ],
      packageRoot,
    ),
  )[0];
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', [
    'install',
    join(directory, packed.filename),
    '--offline',
    '--ignore-scripts',
    '--omit=dev',
    '--no-audit',
    '--no-fund',
    '--cache',
    join(directory, 'cache'),
  ]);

  node(`
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import * as root from '${packageName}';
    import * as core from '${packageName}/core';
    const require = createRequire(import.meta.url);
    assert.throws(() => require.resolve('react'), { code: 'MODULE_NOT_FOUND' });
    assert.equal('useMinesweeper' in root, false);
    assert.equal(root.createGame, core.createGame);
    const game = root.transition(root.createGame({ seed: 1 }), { type: 'open', cell: 0 });
    assert.notEqual(game.status, 'ready');
    assert.equal(root.getBoard(game).cells.length, 81);
  `);

  const fixture = join(directory, 'consumer.mts');
  writeFileSync(
    fixture,
    `
    import { createGame, getBoard } from '${packageName}';
    import type { Minesweeper } from '${packageName}/react';
    const game = createGame({ seed: 0 });
    for (const cell of getBoard(game).cells) {
      if (cell.state === 'hidden') {
        // @ts-expect-error hidden content must not leak through the public declarations
        cell.value;
      } else {
        const value: number | 'mine' = cell.value;
        void value;
      }
    }
    declare const hook: Minesweeper;
    hook.setFlag(0, 'question');
  `,
  );
  for (const [module, resolution] of [
    ['node16', 'node16'],
    ['esnext', 'bundler'],
  ]) {
    run(process.execPath, [
      require.resolve('typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--target',
      'es2018',
      '--module',
      module,
      '--moduleResolution',
      resolution,
      fixture,
    ]);
  }

  const react = dirname(require.resolve('react/package.json'));
  symlinkSync(react, join(directory, 'node_modules/react'), 'dir');
  node(`
    import assert from 'node:assert/strict';
    import { useMinesweeper } from '${packageName}/react';
    assert.equal(typeof useMinesweeper, 'function');
  `);
  console.log(
    'Package checks passed: React-free default/core entry, optional React adapter, ESM, public types.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
