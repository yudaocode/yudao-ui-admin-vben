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
  { key: 'title', label: '标题', desc: '商品标题文案' },
  { key: 'description', label: '描述', desc: '长描述 / 规格说明' },
  { key: 'feature', label: '卖点', desc: 'Bullet / Feature 条目' },
];

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
    allowedFeatureCounts: [5, 8],
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
            <div class="field">
              <label>当前平台</label>
              <Select
                v-if="!lockedPlatformId"
                :value="activePlatformId"
                :options="platformOptions"
                @change="(v: any) => onSelectPlatform(v)"
              />
              <b v-else>{{
                platforms.find((p) => p.id === lockedPlatformId)?.name ||
                '当前平台'
              }}</b>
            </div>
            <div class="grid-2">
              <div class="field">
                <label>规则名称</label>
                <Input v-model:value="form.name" />
              </div>
              <div class="field row">
                <label>启用</label>
                <Switch v-model:checked="form.enabled" />
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label>默认卖点数</label>
                <Select
                  v-model:value="form.defaultFeatureCount"
                  :options="[
                    { label: '5 条', value: 5 },
                    { label: '8 条', value: 8 },
                  ]"
                  @change="syncJsonFromFields"
                />
              </div>
              <div class="field row">
                <label>生成标题</label>
                <Switch
                  v-model:checked="form.generateTitle"
                  @change="syncJsonFromFields"
                />
              </div>
            </div>
            <div class="field">
              <label>备注</label>
              <Input v-model:value="form.remark" />
            </div>

            <div class="section-card">
              <div class="section-card-title">按文案段细化规则</div>
              <Tabs v-model:active-key="activeSection" type="card" size="small">
                <Tabs.TabPane
                  v-for="meta in sectionMeta"
                  :key="meta.key"
                  :tab="meta.label"
                >
                  <p class="section-desc">{{ meta.desc }}</p>

                  <div class="rule-block">
                    <div class="rule-block-title">提示规则</div>
                    <div class="field">
                      <label>生成提示词 / Hint</label>
                      <Textarea
                        v-model:value="form.sections[meta.key].hint"
                        :rows="3"
                        :placeholder="`${meta.label}生成时的风格与要点提示`"
                        @change="syncJsonFromFields"
                      />
                    </div>
                  </div>

                  <div class="rule-block">
                    <div class="rule-block-title">字符规则</div>
                    <div class="grid-3">
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
                      <div class="field row">
                        <label>禁止标点</label>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].noPunctuation
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <div class="field row">
                        <label>段末仅允许句号</label>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].segmentEndPeriodOnly
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                      <div class="field row">
                        <label>首段标题加粗</label>
                        <Switch
                          v-model:checked="
                            form.sections[meta.key].boldLeadTitle
                          "
                          @change="syncJsonFromFields"
                        />
                      </div>
                    </div>
                  </div>

                  <template v-if="meta.key === 'description'">
                    <div class="rule-block">
                      <div class="rule-block-title">描述版式</div>
                      <div class="grid-2">
                        <div class="field">
                          <label>版式模式</label>
                          <Input
                            v-model:value="form.descMode"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field row">
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
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>备注标题</label>
                          <Input
                            v-model:value="form.notesHeading"
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
                    </div>
                  </template>

                  <template v-if="meta.key === 'feature'">
                    <div class="rule-block">
                      <div class="rule-block-title">卖点模式 5 条</div>
                      <div class="grid-2">
                        <div class="field">
                          <label>标题提示</label>
                          <Input
                            v-model:value="form.mode5.titleHint"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>分隔符</label>
                          <Input
                            v-model:value="form.mode5.separator"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field row">
                          <label>拆分标题/内容</label>
                          <Switch
                            v-model:checked="form.mode5.splitTitleContent"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field row">
                          <label>必须冒号</label>
                          <Switch
                            v-model:checked="form.mode5.requireColon"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="rule-block">
                      <div class="rule-block-title">卖点模式 8 条</div>
                      <div class="grid-2">
                        <div class="field">
                          <label>标题提示</label>
                          <Input
                            v-model:value="form.mode8.titleHint"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field">
                          <label>分隔符</label>
                          <Input
                            v-model:value="form.mode8.separator"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field row">
                          <label>拆分标题/内容</label>
                          <Switch
                            v-model:checked="form.mode8.splitTitleContent"
                            @change="syncJsonFromFields"
                          />
                        </div>
                        <div class="field row">
                          <label>必须冒号</label>
                          <Switch
                            v-model:checked="form.mode8.requireColon"
                            @change="syncJsonFromFields"
                          />
                        </div>
                      </div>
                    </div>
                  </template>
                </Tabs.TabPane>
              </Tabs>
            </div>

            <div class="field">
              <div class="json-head">
                <label>完整规则 JSON</label>
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
              />
            </div>
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
  gap: 16px;
  padding: 4px 2px 16px;
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
}

.xq-rule-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-rule-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  min-height: 560px;
}

.xq-rule-layout.is-locked {
  grid-template-columns: 1fr;
}

.xq-rule-side,
.xq-rule-main {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-rule-side {
  padding: 12px;
}

.side-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.side-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.side-item:hover,
.side-item.active {
  background: #f0f7ff;
}

.side-item .code {
  font-size: 11px;
  color: #9ca3af;
}

.xq-rule-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
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
  color: #6b7280;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.w-full {
  width: 100%;
}

.section-card {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 10px;
}

.section-card-title {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
}

.section-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: #9ca3af;
}

.rule-block {
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.rule-block-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 12px;
}

.json-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 900px) {
  .xq-rule-layout,
  .grid-3,
  .grid-2,
  .switch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
