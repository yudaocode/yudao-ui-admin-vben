import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function findRepoRoot(startDirectory: string) {
  let directory = resolve(startDirectory);
  while (directory !== dirname(directory)) {
    if (existsSync(resolve(directory, 'apps/web-antdv-next'))) {
      return directory;
    }
    directory = dirname(directory);
  }
  throw new Error('Unable to locate the monorepo root');
}

const repoRoot = findRepoRoot(process.cwd());

function readCreatePage(app: 'web-antd' | 'web-antdv-next' | 'web-ele') {
  return readFileSync(
    resolve(
      repoRoot,
      `apps/${app}/src/views/bpm/processInstance/create/index.vue`,
    ),
    'utf8',
  );
}

function readCreateForm(app: 'web-antd' | 'web-antdv-next' | 'web-ele') {
  return readFileSync(
    resolve(
      repoRoot,
      `apps/${app}/src/views/bpm/processInstance/create/modules/form.vue`,
    ),
    'utf8',
  );
}

function readVariableCleanupBlock(
  app: 'web-antd' | 'web-antdv-next' | 'web-ele',
) {
  const source = readCreateForm(app);
  const startMarker = '    // 过滤掉不允许的字段';
  const endMarker = '    setConfAndFields2';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end).trim();
}

function readProcessDefinitionGroupBlock(
  app: 'web-antd' | 'web-antdv-next' | 'web-ele',
) {
  const source = readCreatePage(app);
  const match = source.match(
    /const processDefinitionGroup = computed\(\(\) => \{[\s\S]*?\n\}\);/,
  );

  expect(match).not.toBeNull();
  return match?.[0].trim();
}

describe('bPM process create SFC contracts', () => {
  it('registers the ant dv next TabPane used by the category tabs', () => {
    const source = readCreatePage('web-antdv-next');

    expect(source).toMatch(
      /import\s*\{[\s\S]*\bTabPane\b[\s\S]*\}\s*from ['"]antdv-next['"];/,
    );
    expect(source).toMatch(
      /<TabPane\s+v-for="category in availableCategories"[\s\S]*:key="category\.code"/,
    );
  });

  it.each(['web-antd', 'web-antdv-next', 'web-ele'] as const)(
    'uses category codes as active keys and trims searches in %s',
    (app) => {
      const source = readCreatePage(app);

      expect(source).toContain(
        'const keyword = searchName.value.trim().toLowerCase();',
      );
      expect(source).not.toMatch(
        /activeCategory\.value\s*=\s*availableCategories\.value\[0\]\?\.name/,
      );

      if (app === 'web-antdv-next') {
        expect(source).toContain('@change="handleQuery"');
        expect(source).not.toContain('@input="handleQuery"');
      } else {
        expect(source).toContain('@input="handleQuery"');
        expect(source).not.toContain('@change="handleQuery"');
      }
    },
  );

  it('handles ant dv next search after the v-model update', () => {
    const source = readCreatePage('web-antdv-next');

    expect(source).toContain('@change="handleQuery"');
    expect(source).not.toContain('@input="handleQuery"');
  });

  it.each(['web-antd', 'web-antdv-next', 'web-ele'] as const)(
    'deletes dynamic form variables correctly in %s',
    (app) => {
      const source = readCreateForm(app);

      expect(source).not.toContain('delete formVariables.key');
      expect(source).toContain('if (formVariables)');
      expect(source).toContain('Reflect.deleteProperty(formVariables, key)');
    },
  );

  it('keeps the form-variable cleanup implementation identical across variants', () => {
    const blocks = (['web-antd', 'web-antdv-next', 'web-ele'] as const).map(
      readVariableCleanupBlock,
    );

    expect(blocks[1]).toBe(blocks[0]);
    expect(blocks[2]).toBe(blocks[0]);
  });

  it('keeps the process-definition grouping implementation identical across variants', () => {
    const blocks = (['web-antd', 'web-antdv-next', 'web-ele'] as const).map(
      readProcessDefinitionGroupBlock,
    );

    expect(blocks[1]).toBe(blocks[0]);
    expect(blocks[2]).toBe(blocks[0]);
  });
});
