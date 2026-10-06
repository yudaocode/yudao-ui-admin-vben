<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Switch,
  Tag,
} from 'ant-design-vue';
import draggable from 'vuedraggable';

import {
  getXqFieldPool,
  getXqListingPlatforms,
  getXqListingShops,
  saveXqShopFieldConfig,
} from '#/api/xq/listing';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

import { matchFieldByKeywords } from '../listing-field-zone';
import { VALUE_SOURCE_SELECT_OPTIONS } from './value-sources';

interface FieldRow {
  code: string;
  defaultValue: string;
  groupLabel?: string;
  label: string;
  required?: boolean;
  requirementLevel?: string;
  sourceCount?: number;
  type?: string;
  valueSource: string | undefined;
  valuesList?: string;
  zone: string;
}

interface PartitionRow {
  color: string;
  id: string;
  keywords: string;
  name: string;
  system: boolean;
}

const COUNTRY_OPTIONS = [
  { value: 'US', label: '美国 US' },
  { value: 'CA', label: '加拿大 CA' },
  { value: 'MX', label: '墨西哥 MX' },
  { value: 'UK', label: '英国 UK' },
  { value: 'DE', label: '德国 DE' },
  { value: 'FR', label: '法国 FR' },
  { value: 'IT', label: '意大利 IT' },
  { value: 'ES', label: '西班牙 ES' },
  { value: 'JP', label: '日本 JP' },
  { value: 'AU', label: '澳大利亚 AU' },
  { value: 'IN', label: '印度 IN' },
  { value: 'AE', label: '阿联酋 AE' },
  { value: 'SA', label: '沙特 SA' },
  { value: 'NL', label: '荷兰 NL' },
  { value: 'SE', label: '瑞典 SE' },
  { value: 'PL', label: '波兰 PL' },
  { value: 'BE', label: '比利时 BE' },
  { value: 'IE', label: '爱尔兰 IE' },
  { value: 'SG', label: '新加坡 SG' },
  { value: 'ALL', label: '通用 ALL' },
];

const USER_COLORS = [
  '#7c3aed',
  '#db2777',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
  '#0891b2',
];

const SYSTEM_PARTITIONS: PartitionRow[] = [
  {
    id: 'copy',
    name: '描述',
    keywords: 'title,description,bullet,卖点,长描述',
    system: true,
    color: '#2563eb',
  },
  {
    id: 'product',
    name: '产品',
    keywords: 'sku,upc,gtin,inventory,库存,color',
    system: true,
    color: '#059669',
  },
  {
    id: 'attr',
    name: '属性',
    keywords: 'length,width,height,weight,brand,material,尺寸',
    system: true,
    color: '#d97706',
  },
];

const loading = ref(false);
const saving = ref(false);
const shopLoading = ref(false);
const platforms = ref<XqListingApi.Platform[]>([]);
const shops = ref<XqListingApi.Shop[]>([]);
const lockedPlatformId = useDeskPlatformId();
const activePlatformId = ref('');
const activeShopId = ref('');
const activeCountry = ref('US');
const keyword = ref('');
const onlyRequired = ref(false);
const fields = ref<FieldRow[]>([]);
const totalCount = ref(0);
const categoryCount = ref(0);
const sourceHint = ref('');
const partitions = ref<PartitionRow[]>([...SYSTEM_PARTITIONS]);
const createOpen = ref(false);
const createForm = reactive({ name: '', keywords: '' });

const buckets = reactive<Record<string, FieldRow[]>>({
  unset: [],
  copy: [],
  product: [],
  attr: [],
});

const leftZones = computed(() => {
  const attr = partitions.value.find((p) => p.id === 'attr');
  const rest = partitions.value.filter((p) => p.id !== 'attr');
  const toZone = (p: PartitionRow) => ({
    key: p.id,
    label: p.name,
    hint: p.system ? p.keywords : p.keywords || '用户分组 · 可按关键词归入',
    color: p.color || '#7c3aed',
    system: p.system,
    keywords: p.keywords,
  });
  return [...(attr ? [toZone(attr)] : []), ...rest.map((p) => toZone(p))];
});

const unsetZone = {
  key: 'unset',
  label: '未分区',
  hint: '拖到左侧描述 / 产品 / 属性或自建分组',
  color: '#94a3b8',
};

function ensureBucketKeys() {
  if (!buckets.unset) buckets.unset = [];
  for (const p of partitions.value) {
    if (!buckets[p.id]) buckets[p.id] = [];
  }
}

function syncBucketsFromFields() {
  ensureBucketKeys();
  const known = new Set(partitions.value.map((p) => p.id));
  buckets.unset = fields.value.filter((r) => !r.zone || !known.has(r.zone));
  for (const p of partitions.value) {
    buckets[p.id] = fields.value.filter((r) => r.zone === p.id);
  }
}

function collectFieldsFromBuckets() {
  ensureBucketKeys();
  const ordered: FieldRow[] = [];
  for (const p of partitions.value) {
    ordered.push(...(buckets[p.id] || []));
  }
  ordered.push(...(buckets.unset || []));
  const seen = new Set(ordered.map((r) => r.code));
  const missing = fields.value.filter((r) => !seen.has(r.code));
  fields.value = [...ordered, ...missing];
}

function onDragChange(zone: string, evt: { added?: { element: FieldRow } }) {
  if (evt.added?.element) {
    evt.added.element.zone = zone === 'unset' ? '' : zone;
  }
}

function onRequiredChange(row: FieldRow, checked: boolean) {
  row.required = checked;
  row.groupLabel = checked ? '必填' : '选填';
}

function fieldVisible(row: FieldRow) {
  if (onlyRequired.value && !row.required) return false;
  const q = keyword.value.trim().toLowerCase();
  if (!q) return true;
  return (
    row.label.toLowerCase().includes(q) ||
    row.code.toLowerCase().includes(q) ||
    (row.groupLabel || '').toLowerCase().includes(q)
  );
}

const requiredCount = computed(
  () => fields.value.filter((row) => row.required).length,
);

const mappedCount = computed(
  () =>
    fields.value.filter((row) => row.defaultValue || row.valueSource).length,
);

const zoneCounts = computed(() => {
  const out: Record<string, number> = {
    unset: buckets.unset?.length || 0,
  };
  for (const p of partitions.value) {
    out[p.id] = buckets[p.id]?.length || 0;
  }
  return out;
});

function mergePartitions(raw?: XqListingApi.FieldPartition[]): PartitionRow[] {
  const map = new Map<string, PartitionRow>();
  for (const p of SYSTEM_PARTITIONS) map.set(p.id, { ...p });
  for (const p of raw || []) {
    if (!p?.id) continue;
    if (map.has(p.id) && map.get(p.id)!.system) {
      if (p.keywords) map.get(p.id)!.keywords = p.keywords;
      continue;
    }
    if (p.system) continue;
    map.set(p.id, {
      id: p.id,
      name: p.name || p.id,
      keywords: p.keywords || '',
      system: false,
      color: p.color || USER_COLORS[map.size % USER_COLORS.length]!,
    });
  }
  return [...map.values()];
}

function assignByKeywords(partitionId: string, keywords: string) {
  let n = 0;
  for (const row of fields.value) {
    if (row.zone) continue;
    if (matchFieldByKeywords(row, keywords)) {
      row.zone = partitionId;
      n += 1;
    }
  }
  syncBucketsFromFields();
  return n;
}

function openCreatePartition() {
  createForm.name = '';
  createForm.keywords = '';
  createOpen.value = true;
}

function confirmCreatePartition() {
  const name = createForm.name.trim();
  const keywords = createForm.keywords.trim();
  if (!name) {
    message.warning('请填写分区名称');
    return;
  }
  const id = `u_${Date.now().toString(36)}`;
  partitions.value = [
    ...partitions.value,
    {
      id,
      name,
      keywords,
      system: false,
      color: USER_COLORS[partitions.value.length % USER_COLORS.length]!,
    },
  ];
  ensureBucketKeys();
  const n = keywords ? assignByKeywords(id, keywords) : 0;
  createOpen.value = false;
  message.success(
    keywords
      ? `已创建「${name}」，从字段池归入 ${n} 个字段`
      : `已创建「${name}」`,
  );
}

function removePartition(id: string) {
  const p = partitions.value.find((x) => x.id === id);
  if (!p || p.system) return;
  Modal.confirm({
    title: `删除分区「${p.name}」？`,
    content: '该分区内字段会回到未分区。',
    onOk() {
      for (const row of fields.value) {
        if (row.zone === id) row.zone = '';
      }
      partitions.value = partitions.value.filter((x) => x.id !== id);
      buckets[id] = [];
      syncBucketsFromFields();
    },
  });
}

function rerunPartition(id: string) {
  const p = partitions.value.find((x) => x.id === id);
  if (!p?.keywords) {
    message.warning('该分区还没有模糊匹配关键词');
    return;
  }
  const n = assignByKeywords(id, p.keywords);
  message.success(`已从字段池归入 ${n} 个字段`);
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

async function loadShops() {
  if (!activePlatformId.value) {
    shops.value = [];
    return;
  }
  shopLoading.value = true;
  try {
    shops.value = (await getXqListingShops(activePlatformId.value)) || [];
    if (
      !shops.value.some((s) => s.id === activeShopId.value) &&
      shops.value[0]
    ) {
      activeShopId.value = shops.value[0].id;
    }
  } catch (error: any) {
    shops.value = [];
    message.error(error?.message || '加载店铺失败');
  } finally {
    shopLoading.value = false;
  }
}

async function loadPool() {
  if (!activePlatformId.value || !activeShopId.value || !activeCountry.value) {
    fields.value = [];
    totalCount.value = 0;
    categoryCount.value = 0;
    sourceHint.value = '';
    partitions.value = [...SYSTEM_PARTITIONS];
    syncBucketsFromFields();
    return;
  }
  loading.value = true;
  try {
    const pool = await getXqFieldPool({
      platformId: activePlatformId.value,
      shopId: activeShopId.value,
      country: activeCountry.value,
    });
    totalCount.value = pool?.total || 0;
    categoryCount.value = pool?.categoryCount || 0;
    sourceHint.value = pool?.sourceHint || '';
    partitions.value = mergePartitions(pool?.partitions);
    fields.value = (pool?.fields || []).map((f) => ({
      code: f.code,
      label: f.label || f.code,
      type: f.type,
      requirementLevel: f.requirementLevel,
      required: !!f.required,
      groupLabel: f.groupLabel || (f.required ? '必填' : '选填'),
      defaultValue: f.defaultValue || '',
      valueSource: f.valueSource || undefined,
      valuesList: f.valuesList,
      sourceCount: f.sourceCount,
      zone: f.zone || '',
    }));
    syncBucketsFromFields();
  } catch (error: any) {
    fields.value = [];
    message.error(error?.message || '加载字段池失败');
    syncBucketsFromFields();
  } finally {
    loading.value = false;
  }
}

async function onSelectPlatform(id: string) {
  activePlatformId.value = id;
  activeShopId.value = '';
  fields.value = [];
  await loadShops();
  await loadPool();
}

async function onSelectShop(id: string) {
  activeShopId.value = id;
  await loadPool();
}

async function handleSave() {
  if (!activePlatformId.value || !activeShopId.value || !activeCountry.value) {
    message.warning('请先选择店铺和国家');
    return;
  }
  saving.value = true;
  try {
    collectFieldsFromBuckets();
    await saveXqShopFieldConfig({
      platformId: activePlatformId.value,
      shopId: activeShopId.value,
      country: activeCountry.value,
      fields: fields.value.map((row) => ({
        code: row.code,
        defaultValue: row.defaultValue,
        valueSource: row.valueSource || '',
        zone: row.zone || '',
        required: !!row.required,
      })),
      partitions: partitions.value.map((p) => ({
        id: p.id,
        name: p.name,
        keywords: p.keywords,
        system: p.system,
        color: p.color,
      })),
    });
    message.success('已按店铺和国家保存字段池与分区');
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    await loadPlatforms();
    await loadShops();
    await loadPool();
  } catch (error: any) {
    message.error(error?.message || '初始化失败');
  }
});

watch(lockedPlatformId, async (pid) => {
  if (!pid) return;
  await onSelectPlatform(pid);
});

watch(activeCountry, async () => {
  await loadPool();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-tpl-cfg">
      <div class="xq-tpl-cfg-head">
        <div>
          <h2>模板配置</h2>
          <p>
            已把平台全部原分类字段杂糅成字段池。按店铺和国家编辑；系统固定描述 /
            产品 / 属性三类，其余分区自行创建并用关键词从池中自动归入。
          </p>
        </div>
        <Button
          type="primary"
          :loading="saving"
          :disabled="!activeShopId"
          @click="handleSave"
        >
          保存配置
        </Button>
      </div>

      <div
        class="xq-tpl-cfg-layout"
        :class="{ 'is-locked': !!lockedPlatformId }"
      >
        <div v-if="!lockedPlatformId" class="xq-tpl-cfg-side">
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

        <div class="xq-tpl-cfg-cats">
          <div class="side-title">店铺</div>
          <Spin :spinning="shopLoading">
            <button
              v-for="s in shops"
              :key="s.id"
              class="side-item"
              type="button"
              :class="{ active: activeShopId === s.id }"
              @click="onSelectShop(s.id)"
            >
              <span>{{ s.name }}</span>
              <span class="code">{{ s.code }}</span>
            </button>
            <Empty
              v-if="!shopLoading && !shops.length"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该平台暂无店铺"
            />
          </Spin>
        </div>

        <div class="xq-tpl-cfg-main">
          <Spin :spinning="loading">
            <div class="current-path">
              当前：
              <b>{{
                platforms.find((p) => p.id === activePlatformId)?.name || '—'
              }}</b>
              /
              <b>{{
                shops.find((s) => s.id === activeShopId)?.name || '请选择店铺'
              }}</b>
              /
              <Select
                v-model:value="activeCountry"
                size="small"
                style="width: 160px"
                :options="COUNTRY_OPTIONS"
              />
            </div>
            <div v-if="activeShopId" class="toolbar">
              <Input
                v-model:value="keyword"
                allow-clear
                placeholder="搜索字段名 / 编码"
                style="width: 240px"
              />
              <span class="only-req">
                仅必填
                <Switch v-model:checked="onlyRequired" size="small" />
              </span>
              <Tag>字段池 {{ totalCount }}</Tag>
              <Tag color="red">必填 {{ requiredCount }}</Tag>
              <Tag color="blue">已配 {{ mappedCount }}</Tag>
              <Tag v-if="categoryCount">原分类 {{ categoryCount }}</Tag>
              <Tag
                v-if="sourceHint === 'pool' || sourceHint === 'split'"
                color="blue"
              >
                已用线上拆分字段
              </Tag>
              <Tag v-if="sourceHint === 'amazon-default'" color="orange">
                原库无 AMZ 分类模板，已用亚马逊常用字段
              </Tag>
              <Button size="small" @click="openCreatePartition">
                新建分区
              </Button>
              <span class="toolbar-hint">系统三类固定，其余可自建</span>
            </div>
            <div v-if="activeShopId" class="zone-board">
              <div class="zone-main">
                <section
                  v-for="col in leftZones"
                  :key="col.key"
                  class="zone-col is-row"
                  :style="{ '--zone-color': col.color }"
                >
                  <div class="zone-col-h">
                    <b>{{ col.label }}</b>
                    <span>{{ zoneCounts[col.key] || 0 }}</span>
                    <template v-if="!col.system">
                      <Button
                        type="link"
                        size="small"
                        @click="rerunPartition(col.key)"
                      >
                        再归入
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        @click="removePartition(col.key)"
                      >
                        删除
                      </Button>
                    </template>
                  </div>
                  <p class="zone-col-hint">{{ col.hint }}</p>
                  <draggable
                    v-model="buckets[col.key]"
                    class="zone-list is-wrap"
                    group="xqTplFieldZone"
                    item-key="code"
                    handle=".drag-handle"
                    :animation="160"
                    ghost-class="zone-card-ghost"
                    drag-class="zone-card-drag"
                    @change="(e: any) => onDragChange(col.key, e)"
                  >
                    <template #item="{ element }">
                      <div
                        v-show="fieldVisible(element)"
                        class="zone-card"
                        :class="{ req: element.required }"
                      >
                        <span class="drag-handle" title="拖动">⋮⋮</span>
                        <div class="zone-card-body">
                          <div class="zone-card-title">
                            <em>{{ element.label }}</em>
                            <label class="req-switch">
                              必填
                              <Switch
                                :checked="!!element.required"
                                size="small"
                                @change="
                                  (v: any) => onRequiredChange(element, !!v)
                                "
                              />
                            </label>
                          </div>
                          <span class="field-code">
                            {{ element.code }}
                            <template
                              v-if="
                                element.sourceCount && element.sourceCount > 1
                              "
                            >
                              · {{ element.sourceCount }} 类
                            </template>
                          </span>
                          <Input
                            v-model:value="element.defaultValue"
                            allow-clear
                            size="small"
                            placeholder="默认值"
                          />
                          <Select
                            v-model:value="element.valueSource"
                            allow-clear
                            show-search
                            size="small"
                            option-filter-prop="label"
                            :options="VALUE_SOURCE_SELECT_OPTIONS"
                            placeholder="AI / 商品映射"
                            style="width: 100%"
                          />
                        </div>
                      </div>
                    </template>
                  </draggable>
                </section>
                <button
                  class="add-group"
                  type="button"
                  @click="openCreatePartition"
                >
                  + 新增分组
                </button>
              </div>
              <section
                class="zone-col is-attr"
                :style="{ '--zone-color': unsetZone.color }"
              >
                <div class="zone-col-h">
                  <b>{{ unsetZone.label }}</b>
                  <span>{{ zoneCounts.unset || 0 }}</span>
                </div>
                <p class="zone-col-hint">{{ unsetZone.hint }}</p>
                <draggable
                  v-model="buckets.unset"
                  class="zone-list"
                  group="xqTplFieldZone"
                  item-key="code"
                  handle=".drag-handle"
                  :animation="160"
                  ghost-class="zone-card-ghost"
                  drag-class="zone-card-drag"
                  @change="(e: any) => onDragChange('unset', e)"
                >
                  <template #item="{ element }">
                    <div
                      v-show="fieldVisible(element)"
                      class="zone-card"
                      :class="{ req: element.required }"
                    >
                      <span class="drag-handle" title="拖动">⋮⋮</span>
                      <div class="zone-card-body">
                        <div class="zone-card-title">
                          <em>{{ element.label }}</em>
                          <label class="req-switch">
                            必填
                            <Switch
                              :checked="!!element.required"
                              size="small"
                              @change="
                                (v: any) => onRequiredChange(element, !!v)
                              "
                            />
                          </label>
                        </div>
                        <span class="field-code">
                          {{ element.code }}
                          <template
                            v-if="
                              element.sourceCount && element.sourceCount > 1
                            "
                          >
                            · {{ element.sourceCount }} 类
                          </template>
                        </span>
                        <Input
                          v-model:value="element.defaultValue"
                          allow-clear
                          size="small"
                          placeholder="默认值"
                        />
                        <Select
                          v-model:value="element.valueSource"
                          allow-clear
                          show-search
                          size="small"
                          option-filter-prop="label"
                          :options="VALUE_SOURCE_SELECT_OPTIONS"
                          placeholder="AI / 商品映射"
                          style="width: 100%"
                        />
                      </div>
                    </div>
                  </template>
                </draggable>
              </section>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="请选择左侧店铺，并确认国家"
            />
          </Spin>
        </div>
      </div>
    </div>

    <Modal
      v-model:open="createOpen"
      title="新增分组"
      ok-text="创建并检索归入"
      @ok="confirmCreatePartition"
    >
      <p class="modal-hint">
        填写名称和模糊关键词（如农业、farm、seed、肥料）。创建后会在当前字段池检索，匹配到的未分区字段自动归入。
      </p>
      <div class="modal-form">
        <label>分区名称</label>
        <Input
          v-model:value="createForm.name"
          placeholder="例如：农产品"
          allow-clear
        />
        <label>模糊匹配</label>
        <Input.TextArea
          v-model:value="createForm.keywords"
          :rows="4"
          placeholder="逗号或空格分隔，例如：agriculture, farm, soil, seed, 肥料, 种子"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-tpl-cfg {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 16px;
}

.xq-tpl-cfg-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.xq-tpl-cfg-head h2 {
  margin: 0;
  font-size: 18px;
}

.xq-tpl-cfg-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-tpl-cfg-layout {
  display: grid;
  grid-template-columns: 200px 240px 1fr;
  gap: 16px;
  min-height: 560px;
}

.xq-tpl-cfg-layout.is-locked {
  grid-template-columns: 240px 1fr;
}

.xq-tpl-cfg-side,
.xq-tpl-cfg-cats,
.xq-tpl-cfg-main {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-tpl-cfg-side,
.xq-tpl-cfg-cats {
  max-height: 72vh;
  padding: 12px;
  overflow: auto;
}

.xq-tpl-cfg-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 18px;
}

.toolbar-hint {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}

.zone-board {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 10px;
  align-items: stretch;
  min-height: 0;
}

.zone-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.zone-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-top: 3px solid var(--zone-color, #94a3b8);
  border-radius: 10px;
}

.zone-col.is-row {
  min-height: 0;
}

.zone-col.is-attr {
  min-height: 560px;
}

.add-group {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  background: #fff;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
}

.add-group:hover {
  background: #eff6ff;
}

.zone-col-h {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}

.zone-col-h b {
  font-size: 14px;
  color: #111827;
}

.zone-col-h span {
  font-size: 12px;
  color: var(--zone-color, #6b7280);
}

.zone-col-hint {
  margin: 2px 0 8px;
  font-size: 11px;
  color: #9ca3af;
}

.zone-ops {
  display: flex;
  gap: 4px;
  margin: -4px 0 6px;
}

.zone-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 88px;
  max-height: 62vh;
  padding: 2px;
  overflow: auto;
}

.zone-list.is-wrap {
  flex-flow: row wrap;
  align-content: flex-start;
  max-height: 280px;
}

.zone-list.is-wrap .zone-card {
  width: 240px;
}

.zone-card {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.zone-card.req {
  border-color: #fca5a5;
}

.drag-handle {
  flex: 0 0 auto;
  padding: 2px 4px;
  font-size: 14px;
  line-height: 1.2;
  color: #9ca3af;
  letter-spacing: -2px;
  cursor: grab;
  user-select: none;
}

.zone-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.zone-card-title {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.zone-card-title em {
  flex: 1;
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
}

.zone-tag {
  flex-shrink: 0;
  margin: 0;
}

.req-switch {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
}

.zone-card-ghost {
  opacity: 0.45;
}

.zone-card-drag {
  box-shadow: 0 8px 20px rgb(15 23 42 / 12%);
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: #6b7280;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.only-req {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
}

.field-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #6b7280;
}

.modal-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-form label {
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1100px) {
  .xq-tpl-cfg-layout {
    grid-template-columns: 1fr;
  }

  .xq-tpl-cfg-side,
  .xq-tpl-cfg-cats {
    max-height: 280px;
  }
}
</style>
