<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  Select,
  Spin,
  Switch,
  Tabs,
  Textarea,
} from 'ant-design-vue';

import {
  getXqCopyRules,
  getXqListingPlatforms,
  saveXqCopyRule,
} from '#/api/xq/listing';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

type SectionKey = 'description' | 'feature' | 'title';

interface SectionRule {
  hint: string;
  minLen: number;
  maxLen: number;
  /** 卖点：标题段 / 内容段字数 */
  titleMaxLen?: number;
  contentMaxLen?: number;
  noPunctuation: boolean;
  segmentEndPeriodOnly: boolean;
  boldLeadTitle: boolean;
}

interface ModeRule {
  splitTitleContent: boolean;
  separator: string;
  requireColon: boolean;
  titleHint: string;
}

const loading = ref(false);
const saving = ref(false);
const showRawJson = ref(false);
const activeSection = ref<SectionKey>('title');
const platforms = ref<XqListingApi.Platform[]>([]);
const rules = ref<XqListingApi.CopyRule[]>([]);
const lockedPlatformId = useDeskPlatformId();
const activePlatformId = ref<string>('');

const form = reactive({
  name: '',
  enabled: true,
  remark: '',
  defaultFeatureCount: 5 as number,
  generateTitle: true,
  /** 描述版式（原库 descriptionLayout） */
  descMode: 'amazonLong',
  specsHeading: 'Product Specifications:',
  notesHeading: 'Important Notes:',
  minSpecItems: 5,
  maxSpecItems: 12,
  includeImportantNotes: false,
  sections: {
    title: emptySection(200),
    description: emptySection(2000),
    feature: emptySection(500),
  } as Record<SectionKey, SectionRule>,
  mode5: emptyMode(true),
  mode8: emptyMode(false),
  /** 保留未映射的扩展字段 */
  extra: {} as Record<string, any>,
  configJson: '',
});

function emptySection(maxLen: number): SectionRule {
  return {
    hint: '',
    minLen: 0,
    maxLen,
    titleMaxLen: 60,
    contentMaxLen: 400,
    noPunctuation: false,
    segmentEndPeriodOnly: false,
    boldLeadTitle: false,
  };
}

function emptyMode(requireColon: boolean): ModeRule {
  return {
    splitTitleContent: requireColon,
    separator: ': ',
    requireColon,
    titleHint: 'Short Benefit Title',
  };
}

const activeRule = computed(() =>
  rules.value.find(
    (r) => (r.platformId || '') === (activePlatformId.value || ''),
  ),
);

const platformOptions = computed(() => [
  { label: '通用规则', value: '' },
  ...platforms.value.map((p) => ({
    label: `${p.name} (${p.code})`,
    value: p.id,
  })),
]);

const sectionMeta: Array<{ desc: string; key: SectionKey; label: string }> = [
  {
    key: 'title',
    label: '标题',
    desc: '配置提示词、字数、标点与标题输出结构',
  },
  {
    key: 'description',
    label: '描述',
    desc: '配置提示词、字数、标点与「导语 + 规格」结构',
  },
  {
    key: 'feature',
    label: '卖点',
    desc: '配置提示词、字数、标点与卖点条目结构',
  },
];

/** 当前卖点条数对应的模式配置（5/6→mode5，7+→mode8） */
const activeFeatureMode = computed(() =>
  Number(form.defaultFeatureCount || 5) >= 7 ? form.mode8 : form.mode5,
);

/** 各文案段统一：输出结构示例（随表单联动） */
function structureExampleOf(key: SectionKey): string {
  if (key === 'title') {
    const t = form.sections.title;
    if (t.noPunctuation) {
      return 'Touch Kitchen Faucet Brushed Nickel Pull Down Sprayer for Modern Kitchen Sink';
    }
    return 'Touch Kitchen Faucet with Pull-Down Sprayer, Brushed Nickel Finish.';
  }
  if (key === 'description') {
    const heading = String(
      form.specsHeading || 'Product Specifications:',
    ).trim();
    const notes = String(form.notesHeading || 'Important Notes:').trim();
    if (form.descMode === 'paragraph') {
      return (
        'Upgrade your daily kitchen routine with this touch kitchen faucet. ' +
        'Enjoy effortless control and a clean modern look that fits most sinks.'
      );
    }
    let text =
      'Upgrade your daily kitchen routine with this touch kitchen faucet...\n\n' +
      `${heading}\n` +
      '- Finish: Brushed Nickel\n' +
      '- Body Material: Metal';
    if (form.includeImportantNotes) {
      text += `\n\n${notes}\n- Wipe clean with a soft cloth.`;
    }
    return text;
  }
  // feature
  const mode = activeFeatureMode.value;
  const sep = String(mode.separator || ': ');
  const n = Number(form.defaultFeatureCount || 5);
  if (mode.splitTitleContent) {
    const lines = [
      `Easy Touch Control${sep}Flow starts and stops with a light tap for hands-free convenience.`,
      `Durable Metal Body${sep}Built for daily kitchen use with a lasting brushed finish.`,
    ];
    while (lines.length < Math.min(n, 4)) {
      lines.push(
        `Reliable Daily Use${sep}Designed for busy kitchens and easy cleaning.`,
      );
    }
    return lines
      .slice(0, Math.min(n, 4))
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
  }
  return Array.from({ length: Math.min(n, 3) }, (_, i) => {
    const samples = [
      'Start and stop water flow with a light touch for convenient hands-free use.',
      'Durable metal body with brushed nickel finish suits modern kitchens.',
      'Pull-down sprayer reaches every corner of the sink with ease.',
    ];
    return `${i + 1}. ${samples[i] || samples[0]}`;
  }).join('\n');
}

const titleStructureExample = computed(() => structureExampleOf('title'));
const descStructureExample = computed(() => structureExampleOf('description'));
const featureStructureExample = computed(() => structureExampleOf('feature'));

function parseConfig(json?: string) {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function fillForm(rule?: XqListingApi.CopyRule) {
  const cfg = parseConfig(rule?.configJson);
  const limits = cfg.limits || {};
  const punct = cfg.punctuation || {};
  const bold = cfg.boldLeadTitle || {};
  const layout = cfg.descriptionLayout || {};
  const hints = cfg.hints || {};

  form.name = rule?.name || '文案生成规则';
  form.enabled = rule?.enabled !== false;
  form.remark = rule?.remark || '';
  form.defaultFeatureCount = Number(cfg.defaultFeatureCount || 5);
  form.generateTitle = cfg.generateTitle !== false;

  form.sections.title = {
    hint: String(hints.title || cfg.titleHint || ''),
    minLen: Number(limits.titleMinLen || 0),
    maxLen: Number(limits.titleMaxLen || 200),
    noPunctuation: Boolean(punct.title?.noPunctuation),
    segmentEndPeriodOnly: Boolean(punct.title?.segmentEndPeriodOnly),
    boldLeadTitle: Boolean(bold.title),
  };
  form.sections.description = {
    hint: String(hints.description || cfg.descriptionHint || ''),
    minLen: Number(limits.descriptionMinLen || 0),
    maxLen: Number(limits.descriptionMaxLen || 2000),
    noPunctuation: Boolean(punct.description?.noPunctuation),
    segmentEndPeriodOnly: Boolean(punct.description?.segmentEndPeriodOnly),
    boldLeadTitle: Boolean(bold.description),
  };
  form.sections.feature = {
    hint: String(hints.feature || cfg.featureHint || ''),
    minLen: Number(limits.featureMinLen || 0),
    maxLen: Number(limits.featureMaxLen || 500),
    titleMaxLen: Number(limits.featureTitleMaxLen || 60),
    contentMaxLen: Number(limits.featureContentMaxLen || 400),
    noPunctuation: Boolean(punct.feature?.noPunctuation),
    segmentEndPeriodOnly: Boolean(punct.feature?.segmentEndPeriodOnly),
    boldLeadTitle: Boolean(bold.feature),
  };

  form.descMode = String(layout.mode || 'amazonLong');
  form.specsHeading = String(layout.specsHeading || 'Product Specifications:');
  form.notesHeading = String(layout.notesHeading || 'Important Notes:');
  form.minSpecItems = Number(layout.minSpecItems || 5);
  form.maxSpecItems = Number(layout.maxSpecItems || 12);
  form.includeImportantNotes = Boolean(layout.includeImportantNotes);

  const m5 = cfg.mode5 || {};
  const m8 = cfg.mode8 || {};
  form.mode5 = {
    splitTitleContent: m5.splitTitleContent !== false,
    separator: String(m5.separator ?? ': '),
    requireColon: m5.requireColon !== false,
    titleHint: String(m5.titleHint || 'Short Benefit Title'),
  };
  form.mode8 = {
    splitTitleContent: Boolean(m8.splitTitleContent),
    separator: String(m8.separator ?? ': '),
    requireColon: Boolean(m8.requireColon),
    titleHint: String(m8.titleHint || 'Short Benefit Title'),
  };

  // 保留未在表单中编辑的顶层扩展字段
  const known = new Set([
    'allowedFeatureCounts',
    'boldLeadTitle',
    'defaultFeatureCount',
    'descriptionHint',
    'descriptionLayout',
    'featureHint',
    'generateTitle',
    'hints',
    'limits',
    'mode5',
    'mode8',
    'punctuation',
    'titleHint',
  ]);
  form.extra = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (!known.has(k)) form.extra[k] = v;
  }

  syncJsonFromFields();
}

function syncJsonFromFields() {
  const t = form.sections.title;
  const d = form.sections.description;
  const f = form.sections.feature;
  const cfg: Record<string, any> = {
    ...form.extra,
    defaultFeatureCount: form.defaultFeatureCount,
    allowedFeatureCounts: [5, 6, 7, 8, 9],
    generateTitle: form.generateTitle,
    hints: {
      title: t.hint || '',
      description: d.hint || '',
      feature: f.hint || '',
    },
    limits: {
      titleMinLen: t.minLen,
      titleMaxLen: t.maxLen,
      descriptionMinLen: d.minLen,
      descriptionMaxLen: d.maxLen,
      featureMinLen: f.minLen,
      featureMaxLen: f.maxLen,
      featureTitleMaxLen: f.titleMaxLen ?? 60,
      featureContentMaxLen: f.contentMaxLen ?? 400,
    },
    punctuation: {
      title: {
        noPunctuation: t.noPunctuation,
        segmentEndPeriodOnly: t.segmentEndPeriodOnly,
      },
      description: {
        noPunctuation: d.noPunctuation,
        segmentEndPeriodOnly: d.segmentEndPeriodOnly,
      },
      feature: {
        noPunctuation: f.noPunctuation,
        segmentEndPeriodOnly: f.segmentEndPeriodOnly,
      },
    },
    boldLeadTitle: {
      title: t.boldLeadTitle,
      description: d.boldLeadTitle,
      feature: f.boldLeadTitle,
    },
    mode5: { ...form.mode5 },
    mode8: { ...form.mode8 },
    descriptionLayout: {
      mode: form.descMode,
      specsHeading: form.specsHeading,
      notesHeading: form.notesHeading,
      minSpecItems: form.minSpecItems,
      maxSpecItems: form.maxSpecItems,
      includeImportantNotes: form.includeImportantNotes,
    },
  };
  form.configJson = JSON.stringify(cfg, null, 2);
}

function onSelectPlatform(id: string) {
  activePlatformId.value = id;
  fillForm(activeRule.value);
}

async function loadAll() {
  loading.value = true;
  try {
    const [p, r] = await Promise.all([
      getXqListingPlatforms(),
      getXqCopyRules(),
    ]);
    platforms.value = p || [];
    rules.value = r || [];
    if (lockedPlatformId.value) {
      activePlatformId.value = lockedPlatformId.value;
    }
    fillForm(activeRule.value);
  } catch (error: any) {
    message.error(error?.message || '加载平台/规则失败（请确认原库已配置）');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  syncJsonFromFields();
  try {
    JSON.parse(form.configJson);
  } catch {
    message.error('configJson 不是合法 JSON');
    return;
  }
  saving.value = true;
  try {
    await saveXqCopyRule({
      platformId: activePlatformId.value || '',
      name: form.name,
      configJson: form.configJson,
      enabled: form.enabled,
      remark: form.remark,
    });
    message.success('已保存到原库文案规则');
    await loadAll();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadAll);

watch(lockedPlatformId, (pid) => {
  if (!pid) return;
  onSelectPlatform(pid);
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-rule">
      <div class="xq-rule-head">
        <div>
          <h2>文案管理</h2>
          <p>
            {{
              lockedPlatformId
                ? '当前平台文案规则：按标题 / 描述 / 卖点配置提示、字数与标点。'
                : '每个文案段（标题 / 描述 / 卖点）单独配置提示规则、字符规则、标点规则；写入原库 t_giga_copy_gen_rule。'
            }}
          </p>
        </div>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存规则
        </Button>
      </div>

      <Spin :spinning="loading">
        <div
          v-if="platforms.length || rules.length"
          class="xq-rule-layout"
          :class="{ 'is-locked': !!lockedPlatformId }"
        >
          <div v-if="!lockedPlatformId" class="xq-rule-side">
            <div class="side-title">平台</div>
            <button
              class="side-item"
              type="button"
              :class="{ active: activePlatformId === '' }"
              @click="onSelectPlatform('')"
            >
              通用规则
            </button>
            <button
              v-for="p in platforms"
              :key="p.id"
              class="side-item"
              type="button"
              :class="{ active: activePlatformId === p.id }"
              @click="onSelectPlatform(p.id)"
            >
              <span>{{ p.name }}</span>
              <span class="code">{{ p.code }}</span>
            </button>
          </div>

          <div class="xq-rule-main">
            <section class="panel panel-basic">
              <div class="panel-head">
                <div>
                  <div class="panel-title">基础设置</div>
                  <p class="panel-desc">平台级开关与默认生成参数</p>
                </div>
                <span class="platform-chip">
                  {{
                    lockedPlatformId
                      ? platforms.find((p) => p.id === lockedPlatformId)
                          ?.name || '当前平台'
                      : platformOptions.find(
                          (o) => o.value === activePlatformId,
                        )?.label || '通用规则'
                  }}
                </span>
              </div>

              <div v-if="!lockedPlatformId" class="field field-compact">
                <label>切换平台</label>
                <Select
                  :value="activePlatformId"
                  :options="platformOptions"
                  class="w-platform"
                  @change="(v: any) => onSelectPlatform(v)"
                />
              </div>

              <div class="grid-4">
                <div class="field">
                  <label>规则名称</label>
                  <Input v-model:value="form.name" />
                </div>
                <div class="field">
                  <label>默认卖点数</label>
                  <Select
                    v-model:value="form.defaultFeatureCount"
                    :options="[
                      { label: '5 条', value: 5 },
                      { label: '6 条', value: 6 },
                      { label: '7 条', value: 7 },
                      { label: '8 条', value: 8 },
                      { label: '9 条', value: 9 },
                    ]"
                    @change="syncJsonFromFields"
                  />
                </div>
                <div class="field switch-field">
                  <label>启用</label>
                  <Switch v-model:checked="form.enabled" />
                </div>
                <div class="field switch-field">
                  <label>生成标题</label>
                  <Switch
                    v-model:checked="form.generateTitle"
                    @change="syncJsonFromFields"
                  />
                </div>
              </div>
              <div class="field field-remark">
                <label>备注</label>
                <Input
                  v-model:value="form.remark"
                  allow-clear
                  placeholder="可选，如适用站点 / 特殊说明"
                />
              </div>
            </section>

            <section class="panel panel-sections">
              <div class="panel-head">
                <div>
                  <div class="panel-title">按文案段细化规则</div>
                  <p class="panel-desc">
                    标题 / 描述 / 卖点均按同一套配置：提示词 → 字数 → 标点 →
                    输出结构
                  </p>
                </div>
              </div>
              <Tabs v-model:active-key="activeSection" size="small">
                <Tabs.TabPane
                  v-for="meta in sectionMeta"
                  :key="meta.key"
                  :tab="meta.label"
                >
                  <p class="section-desc">{{ meta.desc }}</p>

                  <div class="rule-block">
                    <div class="rule-block-title">提示规则（给 AI）</div>
                    <div class="field">
                      <label>生成提示词 / Hint</label>
                      <Textarea
                        v-model:value="form.sections[meta.key].hint"
                        :rows="4"
                        :placeholder="
                          meta.key === 'description'
                            ? '长描述风格提示，例如：先写使用场景导语，再列产品规格；语气专业简洁'
                            : meta.key === 'feature'
                              ? '卖点风格提示，例如：每条一句完整英文，突出材质与使用场景'
                              : '标题风格与卖点提示，例如：含核心关键词，无多余标点'
                        "
                        @change="syncJsonFromFields"
                      />
                    </div>
                  </div>

                  <div class="rule-block">
                    <div class="rule-block-title">字符规则</div>
                    <div
                      class="len-grid"
                      :class="{ 'is-feature': meta.key === 'feature' }"
                    >
                      <div class="field">
                        <label>最小字数</label>
                        <InputNumber
                          v-model:value="form.sections[meta.key].minLen"
                          :min="0"
                          :max="5000"
                          class="w-full"
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <div class="field">
                        <label>最大字数</label>
                        <InputNumber
                          v-model:value="form.sections[meta.key].maxLen"
                          :min="1"
                          :max="8000"
                          class="w-full"
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <template v-if="meta.key === 'feature'">
                        <div class="field">
                          <label>卖点标题字数</label>
                          <InputNumber
                            v-model:value="form.sections.feature.titleMaxLen"
                            :min="1"
                            :max="200"
                            class="w-full"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>卖点内容字数</label>
                          <InputNumber
                            v-model:value="form.sections.feature.contentMaxLen"
                            :min="1"
                            :max="1000"
                            class="w-full"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </template>
                    </div>
                  </div>

                  <div class="rule-block">
                    <div class="rule-block-title">标点规则</div>
                    <div class="switch-grid">
                      <div class="switch-item">
                        <div class="switch-copy">
                          <span>禁止标点</span>
                          <small>去掉逗号、句号等标点</small>
                        </div>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].noPunctuation
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <div class="switch-item">
                        <div class="switch-copy">
                          <span>段末仅允许句号</span>
                          <small>段落结束只保留句号</small>
                        </div>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].segmentEndPeriodOnly
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <div class="switch-item">
                        <div class="switch-copy">
                          <span>首段标题加粗</span>
                          <small>卖点短标题加粗（展示用）</small>
                        </div>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].boldLeadTitle
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 每段统一：输出结构（可配参数 + 示例） -->
                  <div class="rule-block">
                    <div class="rule-block-title">
                      {{
                        meta.key === 'title'
                          ? '标题版式 / 输出结构'
                          : meta.key === 'description'
                            ? '描述版式 / 规格结构'
                            : '卖点版式 / 输出结构'
                      }}
                    </div>
                    <p class="layout-tip">
                      {{
                        meta.key === 'title'
                          ? '生成标题时，AI 会遵守上方提示词、字数与标点；下方为结构示例。'
                          : meta.key === 'description'
                            ? '生成长描述时按「导语 + 规格标题 + 规格列表」输出，规格只取原文案可核实属性。'
                            : `当前默认 ${form.defaultFeatureCount} 条卖点，使用${
                                Number(form.defaultFeatureCount) >= 7
                                  ? ' 7+ 条'
                                  : ' 5/6 条'
                              }模式配置；AI 按此结构生成。`
                      }}
                    </p>

                    <template v-if="meta.key === 'description'">
                      <div class="grid-2">
                        <div class="field">
                          <label>版式模式</label>
                          <Select
                            v-model:value="form.descMode"
                            :options="[
                              {
                                label: 'Amazon 长描述 + 规格',
                                value: 'amazonLong',
                              },
                              {
                                label: '仅段落（无规格块）',
                                value: 'paragraph',
                              },
                            ]"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field switch-field">
                          <label>含 Important Notes</label>
                          <Switch
                            v-model:checked="form.includeImportantNotes"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>规格标题</label>
                          <Input
                            v-model:value="form.specsHeading"
                            placeholder="Product Specifications:"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>备注标题</label>
                          <Input
                            v-model:value="form.notesHeading"
                            placeholder="Important Notes:"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>规格最少条数</label>
                          <InputNumber
                            v-model:value="form.minSpecItems"
                            :min="0"
                            :max="50"
                            class="w-full"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>规格最多条数</label>
                          <InputNumber
                            v-model:value="form.maxSpecItems"
                            :min="1"
                            :max="50"
                            class="w-full"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </div>
                    </template>

                    <template v-else-if="meta.key === 'feature'">
                      <div class="grid-2">
                        <div class="field">
                          <label>
                            {{
                              Number(form.defaultFeatureCount) >= 7
                                ? '7+ 条 · 标题提示'
                                : '5/6 条 · 标题提示'
                            }}
                          </label>
                          <Input
                            v-model:value="activeFeatureMode.titleHint"
                            placeholder="Short Benefit Title"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>分隔符</label>
                          <Input
                            v-model:value="activeFeatureMode.separator"
                            placeholder=": "
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field switch-field">
                          <label>拆分标题/内容</label>
                          <Switch
                            v-model:checked="
                              activeFeatureMode.splitTitleContent
                            "
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field switch-field">
                          <label>必须冒号</label>
                          <Switch
                            v-model:checked="activeFeatureMode.requireColon"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </div>
                      <p class="layout-tip" style="margin-top: 10px">
                        也可分别预设另一档条数模式（保存时两套都会写入规则）：
                      </p>
                      <div class="grid-2 mode-secondary">
                        <div class="field">
                          <label>5/6 条 · 标题提示</label>
                          <Input
                            v-model:value="form.mode5.titleHint"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>7+ 条 · 标题提示</label>
                          <Input
                            v-model:value="form.mode8.titleHint"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </div>
                    </template>

                    <template v-else>
                      <p class="layout-tip" style="margin-top: 0">
                        标题无额外版式字段；结构随「禁止标点 /
                        字数」变化，见下方示例。
                      </p>
                    </template>

                    <div class="layout-example">
                      <div class="layout-example-title">输出结构示例</div>
                      <pre>{{
                        meta.key === 'title'
                          ? titleStructureExample
                          : meta.key === 'description'
                            ? descStructureExample
                            : featureStructureExample
                      }}</pre>
                    </div>
                  </div>
                </Tabs.TabPane>
              </Tabs>
            </section>

            <section class="panel panel-json">
              <div class="json-head">
                <div>
                  <div class="panel-title">完整规则 JSON</div>
                  <p class="panel-desc">一般无需改动，仅排错时展开</p>
                </div>
                <Button
                  type="link"
                  size="small"
                  @click="showRawJson = !showRawJson"
                >
                  {{ showRawJson ? '收起' : '展开高级编辑' }}
                </Button>
              </div>
              <Textarea
                v-if="showRawJson"
                v-model:value="form.configJson"
                :rows="16"
                class="json-editor"
              />
            </section>
          </div>
        </div>
        <Empty v-else description="原库暂无平台数据" />
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.xq-rule {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px 20px;
}

.xq-rule-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.xq-rule-head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.xq-rule-head p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #64748b;
}

.xq-rule-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
  align-items: start;
  min-height: 560px;
}

.xq-rule-layout.is-locked {
  grid-template-columns: 1fr;
}

.xq-rule-side {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.side-title {
  padding: 0 4px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.02em;
}

.side-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #334155;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.side-item:hover {
  background: #fff;
  border-color: #dbeafe;
}

.side-item.active {
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 1px rgb(59 130 246 / 12%);
}

.side-item .code {
  font-size: 11px;
  color: #94a3b8;
}

.xq-rule-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  background: transparent;
  border: 0;
}

.panel {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.panel-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.panel-desc {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #94a3b8;
}

.platform-chip {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.row {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.field label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.field-compact {
  max-width: 280px;
  margin-bottom: 12px;
}

.field-remark {
  max-width: 560px;
  margin-top: 12px;
}

.switch-field {
  justify-content: flex-end;
  min-height: 54px;
}

.switch-field label {
  margin-bottom: 2px;
}

.grid-4 {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(120px, 0.8fr) 100px 100px;
  gap: 12px 14px;
  align-items: end;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.len-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 180px));
  gap: 12px;
}

.len-grid.is-feature {
  grid-template-columns: repeat(4, minmax(0, 160px));
}

.w-full {
  width: 100%;
}

.w-platform {
  width: 100%;
}

.section-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: #94a3b8;
}

.rule-block {
  padding: 14px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 12px;
}

.rule-block:last-child {
  margin-bottom: 0;
}

.rule-block-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.switch-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 10px;
}

.switch-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.switch-copy span {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.switch-copy small {
  font-size: 11px;
  line-height: 1.35;
  color: #94a3b8;
}

.panel-sections :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.panel-sections :deep(.ant-tabs-tab) {
  padding: 8px 14px !important;
  border-radius: 8px 8px 0 0;
}

.panel-sections :deep(.ant-tabs-tab-active) {
  font-weight: 600;
}

.layout-tip {
  margin: -4px 0 12px;
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
}

.mode-secondary {
  padding: 10px 12px;
  margin-bottom: 4px;
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

.layout-example {
  padding: 12px 14px;
  margin-top: 14px;
  background: #0f172a;
  border-radius: 10px;
}

.layout-example-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.layout-example pre {
  margin: 0;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #e2e8f0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.panel-json .json-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.json-editor {
  margin-top: 10px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .grid-4,
  .len-grid,
  .len-grid.is-feature,
  .switch-grid,
  .grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 900px) {
  .xq-rule-layout,
  .grid-4,
  .len-grid,
  .len-grid.is-feature,
  .grid-2,
  .switch-grid {
    grid-template-columns: 1fr;
  }

  .switch-field {
    min-height: auto;
  }
}
</style>
