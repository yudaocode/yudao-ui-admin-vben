#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/yunai/Java/yudao-all-in-vben/yudao-ui-admin-vben/apps';
const SRC = path.join(ROOT, 'web-antd/src');
const PATHS_TO_SYNC = [
  'api/hrm/performance',
  'views/hrm/performance',
  'views/hrm/utils/performance.ts',
  'views/hrm/utils/format-performance.ts',
];

const ELE_IMPORT_MAP = {
  Alert: 'ElAlert',
  Avatar: 'ElAvatar',
  Button: 'ElButton',
  Card: 'ElCard',
  Checkbox: 'ElCheckbox',
  Col: 'ElCol',
  DatePicker: 'ElDatePicker',
  Descriptions: 'ElDescriptions',
  Empty: 'ElEmpty',
  Form: 'ElForm',
  Input: 'ElInput',
  InputNumber: 'ElInputNumber',
  Row: 'ElRow',
  Select: 'ElSelect',
  Spin: 'ElIcon',
  Steps: 'ElSteps',
  Switch: 'ElSwitch',
  Table: 'ElTable',
  TabPane: 'ElTabPane',
  Tabs: 'ElTabs',
  Tag: 'ElTag',
  Timeline: 'ElTimeline',
  TimelineItem: 'ElTimelineItem',
  message: 'ElMessage',
};

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else files.push(full);
  }
  return files;
}

function transformAntdvNext(content) {
  return content.replaceAll("'ant-design-vue'", "'antdv-next'");
}

function transformEle(content) {
  const importMatch = content.match(
    /import\s+\{([^}]+)\}\s+from\s+'ant-design-vue';/,
  );
  if (!importMatch) return content;

  const names = importMatch[1]
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  const extra = [];
  const eleNames = names
    .map((name) => {
      if (name === 'message') return 'ElMessage as message';
      if (name === 'Spin') {
        extra.push('ElLoading as Spin');
        return null;
      }
      const alias = ELE_IMPORT_MAP[name] || `El${name}`;
      return `${alias} as ${name}`;
    })
    .filter(Boolean);

  if (extra.length > 0) eleNames.push(...extra);

  let s = content.replace(
    importMatch[0],
    `import { ${eleNames.join(', ')} } from 'element-plus';`,
  );

  s = s
    .replaceAll('allowClear', 'clearable')
    .replaceAll('show-search', 'filterable')
    .replaceAll('show-count', 'show-word-limit')
    .replaceAll('v-model:checked', 'v-model')
    .replaceAll('v-model:value', 'v-model')
    .replaceAll('type="link"', 'link')
    .replaceAll('<Form.Item', '<ElFormItem')
    .replaceAll('</Form.Item>', '</ElFormItem>')
    .replaceAll('<Descriptions.Item', '<ElDescriptionsItem')
    .replaceAll('</Descriptions.Item>', '</ElDescriptionsItem>')
    .replaceAll('<Tabs.TabPane', '<ElTabPane')
    .replaceAll('</Tabs.TabPane>', '</ElTabPane>')
    .replaceAll('<Steps.Step', '<ElStep')
    .replaceAll('<Input.TextArea', '<Input type="textarea"');

  if (
    s.includes('<ElFormItem') &&
    !eleNames.some((n) => n.includes('ElFormItem'))
  ) {
    s = s.replace(
      /import \{([^}]+)\} from 'element-plus';/,
      (m, imports) => `import {${imports}, ElFormItem} from 'element-plus';`,
    );
  }
  if (s.includes('<ElStep') && !eleNames.some((n) => n.includes('ElStep'))) {
    s = s.replace(
      /import \{([^}]+)\} from 'element-plus';/,
      (m, imports) => `import {${imports}, ElStep} from 'element-plus';`,
    );
  }
  if (
    s.includes('<ElTabPane') &&
    !eleNames.some((n) => n.includes('ElTabPane'))
  ) {
    s = s.replace(
      /import \{([^}]+)\} from 'element-plus';/,
      (m, imports) => `import {${imports}, ElTabPane} from 'element-plus';`,
    );
  }
  if (
    s.includes('<ElDescriptionsItem') &&
    !eleNames.some((n) => n.includes('ElDescriptionsItem'))
  ) {
    s = s.replace(
      /import \{([^}]+)\} from 'element-plus';/,
      (m, imports) =>
        `import {${imports}, ElDescriptionsItem} from 'element-plus';`,
    );
  }

  // Spin -> v-loading wrapper
  s = s
    .replaceAll(/<Spin :spinning="([^"]+)">/g, '<div v-loading="$1">')
    .replaceAll('</Spin>', '</div>');

  return s;
}

function syncToApp(app, transform) {
  for (const rel of PATHS_TO_SYNC) {
    const srcPath = path.join(SRC, rel);
    const destPath = path.join(ROOT, app, 'src', rel);
    if (!fs.existsSync(srcPath)) continue;
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      for (const file of walkFiles(srcPath)) {
        const relFile = path.relative(srcPath, file);
        const destFile = path.join(destPath, relFile);
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        let content = fs.readFileSync(file, 'utf8');
        if (transform) content = transform(content);
        fs.writeFileSync(destFile, content);
      }
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      let content = fs.readFileSync(srcPath, 'utf8');
      if (transform) content = transform(content);
      fs.writeFileSync(destPath, content);
    }
  }
  console.log(`Synced performance to ${app}`);
}

syncToApp('web-antdv-next', transformAntdvNext);
syncToApp('web-ele', transformEle);
console.log('Done');
