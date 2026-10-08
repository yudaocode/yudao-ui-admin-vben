<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type {
  ImageSlot,
  ImageSlotType,
} from '#/views/xq/product/image-slot-rule';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  message,
  Select,
  Spin,
  Switch,
  Tag,
  Tree,
} from 'ant-design-vue';

import {
  getXqImageRule,
  getXqImageRules,
  getXqListingCategories,
  getXqListingPlatforms,
  saveXqImageRule,
} from '#/api/xq/listing';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  buildImageSlotConfigJson,
  DEFAULT_IMAGE_SLOTS,
  IMAGE_SLOT_TYPES,
  imageSlotTypeLabel,
  parseImageSlotConfig,
  summarizeImageSlots,
} from '#/views/xq/product/image-slot-rule';

const loading = ref(false);
const saving = ref(false);
const catLoading = ref(false);
const platforms = ref<XqListingApi.Platform[]>([]);
const categoryTree = ref<XqListingApi.CategoryNode[]>([]);
const configuredRules = ref<XqListingApi.ImageRule[]>([]);
const lockedPlatformId = useDeskPlatformId();
const activePlatformId = ref<string>('');
/** 空字符串 = 平台默认 */
const activeCategoryId = ref<string>('');
const activeCategoryName = ref<string>('平台默认');
const selectedTreeKeys = ref<string[]>(['__default__']);
const addType = ref<ImageSlotType>('scene');

const form = reactive({
  name: '图片生成规则',
  enabled: true,
  remark: '',
});
const slots = ref<ImageSlot[]>([...DEFAULT_IMAGE_SLOTS]);

const configuredIds = computed(() => {
  const set = new Set<string>();
  for (const r of configuredRules.value) {
    set.add(r.categoryId || '');
  }
  return set;
});

const slotSummary = computed(() => summarizeImageSlots(slots.value));

const typeOptions = IMAGE_SLOT_TYPES.map((t) => ({
  label: t.label,
  value: t.value,
}));

const treeData = computed(() => {
  const mapNodes = (
    nodes: XqListingApi.CategoryNode[],
  ): Array<Record<string, any>> =>
    (nodes || []).map((n) => {
      const configured = configuredIds.value.has(n.id);
      return {
        key: n.id,
        title: configured ? `${n.name} · 已配` : n.name,
        children: n.children?.length ? mapNodes(n.children) : undefined,
      };
    });
  const defaultConfigured = configuredIds.value.has('');
  return [
    {
      key: '__default__',
      title: defaultConfigured ? '平台默认规则 · 已配' : '平台默认规则',
      children: undefined,
    },
    ...mapNodes(categoryTree.value),
  ];
});

function findCategoryName(
  nodes: XqListingApi.CategoryNode[],
  id: string,
): string | undefined {
  for (const n of nodes || []) {
    if (n.id === id) return n.name;
    const child = findCategoryName(n.children || [], id);
    if (child) return child;
  }
  return undefined;
}

function addSlot(type?: ImageSlotType) {
  const t = type || addType.value;
  slots.value = [
    ...slots.value,
    { imageType: t, label: imageSlotTypeLabel(t) },
  ];
}

function removeSlot(index: number) {
  slots.value = slots.value.filter((_, i) => i !== index);
}

function moveSlot(index: number, delta: number) {
  const next = [...slots.value];
  const j = index + delta;
  if (j < 0 || j >= next.length) return;
  const tmp = next[index]!;
  next[index] = next[j]!;
  next[j] = tmp;
  slots.value = next;
}

function changeSlotType(index: number, type: ImageSlotType) {
  const next = [...slots.value];
  next[index] = { imageType: type, label: imageSlotTypeLabel(type) };
  slots.value = next;
}

function resetDefaultSlots() {
  slots.value = DEFAULT_IMAGE_SLOTS.map((s) => ({ ...s }));
}

async function loadPlatforms() {
  platforms.value = (await getXqListingPlatforms()) || [];
  if (lockedPlatformId.value) {
    activePlatformId.value = lockedPlatformId.value;
    return;
  }
  if (!activePlatformId.value && platforms.value[0]) {
    activePlatformId.value = platforms.value[0].id;
  }
}

async function loadCategoriesAndRules() {
  if (!activePlatformId.value) {
    categoryTree.value = [];
    configuredRules.value = [];
    return;
  }
  catLoading.value = true;
  try {
    const [cats, rules] = await Promise.all([
      getXqListingCategories(activePlatformId.value),
      getXqImageRules(activePlatformId.value),
    ]);
    categoryTree.value = cats || [];
    configuredRules.value = rules || [];
  } catch (error: any) {
    message.error(error?.message || '加载分类/规则失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadRuleForm() {
  loading.value = true;
  try {
    const rule = await getXqImageRule(
      activePlatformId.value,
      activeCategoryId.value,
    );
    form.name = rule?.name || '图片生成规则';
    form.enabled = rule?.enabled !== false;
    form.remark = rule?.remark || '';
    const parsed = parseImageSlotConfig(rule?.configJson);
    slots.value =
      parsed.length > 0 ? parsed : DEFAULT_IMAGE_SLOTS.map((s) => ({ ...s }));
  } catch (error: any) {
    message.error(error?.message || '加载规则失败');
  } finally {
    loading.value = false;
  }
}

async function onSelectPlatform(id: string) {
  activePlatformId.value = id;
  activeCategoryId.value = '';
  activeCategoryName.value = '平台默认';
  selectedTreeKeys.value = ['__default__'];
  await loadCategoriesAndRules();
  await loadRuleForm();
}

async function onSelectCategory(keys: Array<number | string>) {
  const key = String(keys?.[0] ?? '');
  if (!key) return;
  selectedTreeKeys.value = [key];
  if (key === '__default__') {
    activeCategoryId.value = '';
    activeCategoryName.value = '平台默认';
  } else {
    activeCategoryId.value = key;
    activeCategoryName.value = findCategoryName(categoryTree.value, key) || key;
  }
  await loadRuleForm();
}

async function handleSave() {
  if (slots.value.length === 0) {
    message.warning('请至少配置 1 个出图槽位');
    return;
  }
  saving.value = true;
  try {
    const summary = summarizeImageSlots(slots.value);
    await saveXqImageRule({
      platformId: activePlatformId.value || '',
      categoryId: activeCategoryId.value || '',
      categoryName: activeCategoryName.value,
      name: form.name || '图片生成规则',
      promptText: summary,
      negativePrompt: '',
      enabled: form.enabled,
      remark: form.remark,
      configJson: buildImageSlotConfigJson(slots.value),
    });
    message.success('已保存出图规则');
    await loadCategoriesAndRules();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    await loadPlatforms();
    await loadCategoriesAndRules();
    await loadRuleForm();
  } catch (error: any) {
    message.error(error?.message || '初始化失败');
  }
});

watch(lockedPlatformId, async (pid) => {
  if (!pid) return;
  await onSelectPlatform(pid);
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-img-rule">
      <div class="xq-img-rule-head">
        <div>
          <h2>图片管理</h2>
          <p>
            配置平台出图顺序（主图 / 场景图 / 细节图…）。文案 RPA
            生成的提示词将按此规则排列展示。
          </p>
        </div>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存规则
        </Button>
      </div>

      <div
        class="xq-img-rule-layout"
        :class="{ 'is-locked': !!lockedPlatformId }"
      >
        <div v-if="!lockedPlatformId" class="xq-img-rule-side">
          <div class="side-title">平台</div>
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
          <Empty
            v-if="!platforms.length"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="暂无平台"
          />
        </div>

        <div class="xq-img-rule-cats">
          <div class="side-title">
            分类
            <Tag v-if="configuredRules.length" color="blue">
              已配 {{ configuredRules.length }}
            </Tag>
          </div>
          <Spin :spinning="catLoading">
            <Tree
              v-if="treeData.length"
              :tree-data="treeData"
              :selected-keys="selectedTreeKeys"
              :default-expand-all="false"
              show-line
              @select="onSelectCategory"
            />
            <Empty
              v-else-if="!catLoading"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该平台暂无分类"
            />
          </Spin>
        </div>

        <div class="xq-img-rule-main">
          <Spin :spinning="loading">
            <div class="current-path">
              当前：
              <b>{{
                platforms.find((p) => p.id === activePlatformId)?.name || '—'
              }}</b>
              /
              <b>{{ activeCategoryName }}</b>
            </div>

            <div class="field-row">
              <div class="field grow">
                <label>规则名称</label>
                <Input v-model:value="form.name" />
              </div>
              <div class="field row enable">
                <label>启用</label>
                <Switch v-model:checked="form.enabled" />
              </div>
            </div>

            <div class="slots-head">
              <div>
                <label>出图槽位顺序</label>
                <p class="slots-desc">{{ slotSummary }}</p>
              </div>
              <div class="slots-tools">
                <Select
                  v-model:value="addType"
                  style="width: 110px"
                  :options="typeOptions"
                />
                <Button @click="addSlot()">添加</Button>
                <Button type="link" @click="resetDefaultSlots">恢复默认</Button>
              </div>
            </div>

            <div class="slot-quick">
              <button
                v-for="t in IMAGE_SLOT_TYPES"
                :key="t.value"
                type="button"
                class="quick-chip"
                @click="addSlot(t.value)"
              >
                + {{ t.label }}
              </button>
            </div>

            <div v-if="slots.length" class="slot-list">
              <div
                v-for="(slot, index) in slots"
                :key="`slot-${index}-${slot.imageType}`"
                class="slot-row"
              >
                <span class="slot-idx">{{ index + 1 }}</span>
                <Select
                  :value="slot.imageType"
                  style="width: 140px"
                  :options="typeOptions"
                  @change="(v: any) => changeSlotType(index, v)"
                />
                <Tag color="processing">
                  {{ imageSlotTypeLabel(slot.imageType) }}
                </Tag>
                <span class="slot-spacer"></span>
                <Button
                  type="text"
                  size="small"
                  :disabled="index === 0"
                  @click="moveSlot(index, -1)"
                >
                  上移
                </Button>
                <Button
                  type="text"
                  size="small"
                  :disabled="index === slots.length - 1"
                  @click="moveSlot(index, 1)"
                >
                  下移
                </Button>
                <Button
                  type="text"
                  danger
                  size="small"
                  @click="removeSlot(index)"
                >
                  删除
                </Button>
              </div>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="暂无槽位，请添加出图类型"
            />

            <div class="field" style="margin-top: 12px">
              <label>备注</label>
              <Input v-model:value="form.remark" placeholder="可选" />
            </div>
          </Spin>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.xq-img-rule {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 16px;
}

.xq-img-rule-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.xq-img-rule-head h2 {
  margin: 0;
  font-size: 18px;
}

.xq-img-rule-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-img-rule-layout {
  display: grid;
  grid-template-columns: 200px 260px 1fr;
  gap: 16px;
  min-height: 560px;
}

.xq-img-rule-layout.is-locked {
  grid-template-columns: 260px 1fr;
}

.xq-img-rule-side,
.xq-img-rule-cats,
.xq-img-rule-main {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
}

.xq-img-rule-side,
.xq-img-rule-cats {
  max-height: 72vh;
  padding: 12px;
  overflow: auto;
}

.xq-img-rule-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
}

.side-title {
  display: flex;
  gap: 8px;
  align-items: center;
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

.current-path {
  margin-bottom: 4px;
  font-size: 13px;
  color: #6b7280;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.grow {
  flex: 1;
}

.field.row {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.field-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.field.enable {
  padding-bottom: 4px;
}

.field label,
.slots-head label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.slots-head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 4px;
}

.slots-desc {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.slots-tools {
  display: flex;
  gap: 8px;
  align-items: center;
}

.slot-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-chip {
  padding: 2px 10px;
  font-size: 12px;
  color: #1677ff;
  cursor: pointer;
  background: #f0f7ff;
  border: 1px solid #bae0ff;
  border-radius: 999px;
}

.quick-chip:hover {
  background: #e6f4ff;
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 48vh;
  padding: 4px 0;
  overflow: auto;
}

.slot-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: #fafbfc;
  border: 1px solid #e8eaed;
  border-radius: 8px;
}

.slot-idx {
  display: inline-flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 6px;
}

.slot-spacer {
  flex: 1;
}

@media (max-width: 1100px) {
  .xq-img-rule-layout {
    grid-template-columns: 1fr;
  }

  .xq-img-rule-side,
  .xq-img-rule-cats {
    max-height: 280px;
  }
}
</style>
