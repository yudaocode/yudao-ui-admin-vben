<script lang="ts" setup>
import type { FieldFillMode } from './field-form-row.vue';

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

import {
  dedupeListingFieldsByCode,
  matchFieldByKeywords,
} from '../listing-field-zone';
import FieldFormRow from './field-form-row.vue';
import { translateFieldLabel } from './field-label-zh';

interface FieldRow {
  code: string;
  defaultValue: string;
  fixed?: boolean;
  groupLabel?: string;
  label: string;
  options?: XqListingApi.FieldEnumOption[];
  remark?: string;
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
    name: '产品文案',
    keywords: 'title,description,bullet,卖点,长描述',
    system: true,
    color: '#2563eb',
  },
  {
    id: 'product',
    name: '产品基本信息',
    keywords: 'sku,upc,gtin,inventory,库存,color,price,售价',
    system: true,
    color: '#059669',
  },
  {
    id: 'attr',
    name: '产品规格',
    keywords: 'length,width,height,weight,brand,material,尺寸',
    system: true,
    color: '#d97706',
  },
  {
    id: 'other',
    name: '其他属性',
    keywords: '',
    system: true,
    color: '#94a3b8',
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
const renameOpen = ref(false);
const renameForm = reactive({ id: '', name: '' });

const buckets = reactive<Record<string, FieldRow[]>>({
  copy: [],
  product: [],
  attr: [],
  other: [],
});

/** 系统三区 + 用户分组；「其他属性」永远独立置尾，不进左侧主列 */
function orderedPartitions(list: PartitionRow[]): PartitionRow[] {
  const byId = new Map(list.map((p) => [p.id, p]));
  const mainSys = ['copy', 'product', 'attr']
    .map((id) => byId.get(id))
    .filter((p): p is PartitionRow => !!p);
  const custom = list.filter(
    (p) =>
      p.id !== 'copy' &&
      p.id !== 'product' &&
      p.id !== 'attr' &&
      p.id !== 'other',
  );
  const other =
    byId.get('other') ||
    SYSTEM_PARTITIONS.find((p) => p.id === 'other') ||
    null;
  return other ? [...mainSys, ...custom, other] : [...mainSys, ...custom];
}

function toZoneCol(p: PartitionRow) {
  let hint = p.keywords || '用户分组 · 可按关键词归入';
  if (p.id === 'other') {
    hint = '未归入任何分组的字段 · 独立侧栏';
  } else if (p.system) {
    hint = p.keywords;
  }
  return {
    key: p.id,
    label: p.name,
    hint,
    color: p.color || '#7c3aed',
    system: p.system,
    keywords: p.keywords,
  };
}

const leftZones = computed(() =>
  orderedPartitions(partitions.value)
    .filter((p) => p.id !== 'other')
    .map((p) => toZoneCol(p)),
);

const otherZone = computed(() => {
  const p =
    partitions.value.find((x) => x.id === 'other') ||
    SYSTEM_PARTITIONS.find((x) => x.id === 'other')!;
  return toZoneCol(p);
});

const collapsed = reactive<Record<string, boolean>>({});
const zoneQuery = reactive<Record<string, string>>({ other: '' });
const showZh = ref(true);

function zoneOpen(key: string) {
  return collapsed[key] !== true;
}

function toggleZone(key: string) {
  collapsed[key] = zoneOpen(key);
}

function ensureBucketKeys() {
  for (const p of partitions.value) {
    if (!buckets[p.id]) buckets[p.id] = [];
    if (zoneQuery[p.id] === undefined) zoneQuery[p.id] = '';
  }
}

function syncBucketsFromFields() {
  ensureBucketKeys();
  const known = new Set(partitions.value.map((p) => p.id));
  for (const p of partitions.value) {
    buckets[p.id] = [];
  }
  for (const row of fields.value) {
    const zone = row.zone && known.has(row.zone) ? row.zone : 'other';
    if (!buckets[zone]) buckets[zone] = [];
    buckets[zone]!.push(row);
    if (!row.zone || !known.has(row.zone)) {
      row.zone = 'other';
    }
  }
}

function collectFieldsFromBuckets() {
  ensureBucketKeys();
  const ordered: FieldRow[] = [];
  for (const p of orderedPartitions(partitions.value)) {
    ordered.push(...(buckets[p.id] || []));
  }
  const seen = new Set(ordered.map((r) => r.code));
  const missing = fields.value.filter((r) => !seen.has(r.code));
  fields.value = [...ordered, ...missing];
}

function onDragChange(zone: string, evt: { added?: { element: FieldRow } }) {
  if (evt.added?.element) {
    evt.added.element.zone = zone || 'other';
  }
}

function fillModeLabel(mode: FieldFillMode) {
  if (mode === 'fixed') return '固定';
  if (mode === 'required') return '必填';
  return '非必填';
}

/** 仅打展示标记（标签+备注），不改 required 校验、不锁定输入 */
function onFillModeChange(row: FieldRow, mode: FieldFillMode) {
  row.fixed = mode === 'fixed';
  row.groupLabel = fillModeLabel(mode);
}

function matchQuery(row: FieldRow, raw: string) {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const zh = translateFieldLabel(row.label, row.code).toLowerCase();
  return (
    row.label.toLowerCase().includes(q) ||
    row.code.toLowerCase().includes(q) ||
    zh.includes(q) ||
    (row.groupLabel || '').toLowerCase().includes(q) ||
    (row.remark || '').toLowerCase().includes(q)
  );
}

function fieldVisible(row: FieldRow) {
  if (onlyRequired.value && !row.required) return false;
  return matchQuery(row, keyword.value);
}

function zoneFieldVisible(zoneKey: string, row: FieldRow) {
  if (!fieldVisible(row)) return false;
  return matchQuery(row, zoneQuery[zoneKey] || '');
}

const requiredCount = computed(
  () => fields.value.filter((row) => row.required).length,
);

const mappedCount = computed(
  () =>
    fields.value.filter((row) => row.defaultValue || row.valueSource).length,
);

const zoneCounts = computed(() => {
  const out: Record<string, number> = {};
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
      const sys = map.get(p.id)!;
      if (p.keywords) sys.keywords = p.keywords;
      if (p.name?.trim()) sys.name = p.name.trim();
      if (p.color) sys.color = p.color;
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
  return orderedPartitions([...map.values()]);
}

function assignByKeywords(partitionId: string, keywords: string) {
  let n = 0;
  for (const row of fields.value) {
    if (row.zone && row.zone !== 'other') continue;
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
  const next: PartitionRow = {
    id,
    name,
    keywords,
    system: false,
    color: USER_COLORS[partitions.value.length % USER_COLORS.length]!,
  };
  // 插在「其他属性」之前，保证 other 永远在尾
  const withoutOther = partitions.value.filter((p) => p.id !== 'other');
  const other = partitions.value.find((p) => p.id === 'other');
  partitions.value = orderedPartitions(
    other ? [...withoutOther, next, other] : [...withoutOther, next],
  );
  ensureBucketKeys();
  collapsed[id] = false;
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
  if (!p || p.system) {
    message.warning('系统分区不可删除，仅可改名');
    return;
  }
  Modal.confirm({
    title: `删除分区「${p.name}」？`,
    content: '该分区内字段会回到「其他属性」。',
    onOk() {
      for (const row of fields.value) {
        if (row.zone === id) row.zone = 'other';
      }
      partitions.value = partitions.value.filter((x) => x.id !== id);
      buckets[id] = [];
      syncBucketsFromFields();
    },
  });
}

function openRenamePartition(id: string) {
  const p = partitions.value.find((x) => x.id === id);
  if (!p) return;
  renameForm.id = id;
  renameForm.name = p.name;
  renameOpen.value = true;
}

function confirmRenamePartition() {
  const name = renameForm.name.trim();
  if (!name) {
    message.warning('请填写分区名称');
    return;
  }
  const p = partitions.value.find((x) => x.id === renameForm.id);
  if (!p) {
    renameOpen.value = false;
    return;
  }
  p.name = name;
  renameOpen.value = false;
  message.success(`已改名为「${name}」`);
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
    fields.value = dedupeListingFieldsByCode(pool?.fields || []).map((f) => ({
      code: f.code,
      label: f.label || f.code,
      type: f.type,
      requirementLevel: f.requirementLevel,
      required: !!f.required,
      fixed: !!f.fixed,
      remark: f.remark || '',
      groupLabel: (() => {
        if (f.groupLabel) return f.groupLabel;
        if (f.fixed) return '固定';
        if (f.required) return '必填';
        return '非必填';
      })(),
      defaultValue: f.defaultValue || '',
      valueSource: f.valueSource || undefined,
      valuesList: f.valuesList,
      options: f.options || [],
      sourceCount: f.sourceCount,
      zone: f.zone || '',
    }));
    totalCount.value = fields.value.length;
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
        // required 保持平台原值；fixed/remark/groupLabel 仅作展示标记
        required: !!row.required,
        fixed: !!row.fixed,
        remark: row.remark || '',
        groupLabel: row.groupLabel || '',
      })),
      partitions: orderedPartitions(partitions.value).map((p) => ({
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
            字段池按店铺和国家编辑。左侧为产品文案 / 基本信息 /
            规格与自建分组；右侧「其他属性」为未分组字段，独立侧栏且排序始终在尾。文案页只展示有字段的分区；相同编码去重。价格映射请选一件代发价格或自提价格，提到顶栏与
            SKU/UPC 一起展示。
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
              <span class="toolbar-hint">左侧：系统区+自建分组；右侧：未分组（始终在尾）</span>
            </div>
            <div v-if="activeShopId" class="zone-board">
              <div class="zone-main">
                <section
                  v-for="col in leftZones"
                  :key="col.key"
                  class="zone-col is-row"
                  :class="{ collapsed: !zoneOpen(col.key) }"
                  :style="{ '--zone-color': col.color }"
                >
                  <div class="zone-col-h" @click="toggleZone(col.key)">
                    <span class="caret">{{
                      zoneOpen(col.key) ? '▾' : '▸'
                    }}</span>
                    <b>{{ col.label }}</b>
                    <span>{{ zoneCounts[col.key] || 0 }}</span>
                    <Button
                      type="link"
                      size="small"
                      @click.stop="openRenamePartition(col.key)"
                    >
                      改名
                    </Button>
                    <template v-if="!col.system">
                      <Button
                        type="link"
                        size="small"
                        @click.stop="rerunPartition(col.key)"
                      >
                        再归入
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        @click.stop="removePartition(col.key)"
                      >
                        删除
                      </Button>
                    </template>
                    <Tag v-else color="processing">系统</Tag>
                  </div>
                  <template v-if="zoneOpen(col.key)">
                    <p class="zone-col-hint">{{ col.hint }}</p>
                    <div class="zone-tools" @click.stop>
                      <Input
                        v-model:value="zoneQuery[col.key]"
                        allow-clear
                        size="small"
                        placeholder="搜索本分区字段名 / 编码 / 中文"
                      />
                      <label class="zh-switch">
                        翻译
                        <Switch v-model:checked="showZh" size="small" />
                      </label>
                    </div>
                    <draggable
                      v-model="buckets[col.key]"
                      class="zone-list is-form"
                      group="xqTplFieldZone"
                      item-key="code"
                      handle=".drag-handle"
                      :animation="160"
                      ghost-class="zone-card-ghost"
                      drag-class="zone-card-drag"
                      @change="(e: any) => onDragChange(col.key, e)"
                    >
                      <template #item="{ element }">
                        <FieldFormRow
                          v-show="zoneFieldVisible(col.key, element)"
                          :element="element"
                          :show-zh="showZh"
                          @fill-mode-change="
                            (v) => onFillModeChange(element, v)
                          "
                          @update:default-value="
                            (v) => (element.defaultValue = v)
                          "
                          @update:value-source="
                            (v) => (element.valueSource = v)
                          "
                          @update:remark="(v) => (element.remark = v)"
                        />
                      </template>
                    </draggable>
                  </template>
                </section>
                <button
                  class="add-group"
                  type="button"
                  @click="openCreatePartition"
                >
                  + 新增分组
                </button>
              </div>

              <!-- 未分组：独立右侧栏，始终在尾，不随用户分组插入 -->
              <aside
                class="zone-col zone-other-side"
                :class="{ collapsed: !zoneOpen(otherZone.key) }"
                :style="{ '--zone-color': otherZone.color }"
              >
                <div class="zone-col-h" @click="toggleZone(otherZone.key)">
                  <span class="caret">{{
                    zoneOpen(otherZone.key) ? '▾' : '▸'
                  }}</span>
                  <b>{{ otherZone.label }}</b>
                  <span>{{ zoneCounts[otherZone.key] || 0 }}</span>
                  <Button
                    type="link"
                    size="small"
                    @click.stop="openRenamePartition(otherZone.key)"
                  >
                    改名
                  </Button>
                  <Tag color="processing">系统</Tag>
                </div>
                <template v-if="zoneOpen(otherZone.key)">
                  <p class="zone-col-hint">{{ otherZone.hint }}</p>
                  <div class="zone-tools" @click.stop>
                    <Input
                      v-model:value="zoneQuery[otherZone.key]"
                      allow-clear
                      size="small"
                      placeholder="搜索未分组字段"
                    />
                    <label class="zh-switch">
                      翻译
                      <Switch v-model:checked="showZh" size="small" />
                    </label>
                  </div>
                  <draggable
                    v-model="buckets[otherZone.key]"
                    class="zone-list is-form is-other-side"
                    group="xqTplFieldZone"
                    item-key="code"
                    handle=".drag-handle"
                    :animation="160"
                    ghost-class="zone-card-ghost"
                    drag-class="zone-card-drag"
                    @change="(e: any) => onDragChange(otherZone.key, e)"
                  >
                    <template #item="{ element }">
                      <FieldFormRow
                        v-show="zoneFieldVisible(otherZone.key, element)"
                        compact
                        :element="element"
                        :show-zh="showZh"
                        @fill-mode-change="(v) => onFillModeChange(element, v)"
                        @update:default-value="
                          (v) => (element.defaultValue = v)
                        "
                        @update:value-source="(v) => (element.valueSource = v)"
                        @update:remark="(v) => (element.remark = v)"
                      />
                    </template>
                  </draggable>
                </template>
              </aside>
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
        填写名称和模糊关键词（如农业、farm、seed、肥料）。创建后会在「其他属性」中检索，匹配到的字段自动归入。
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

    <Modal
      v-model:open="renameOpen"
      title="修改分组名称"
      ok-text="保存名称"
      @ok="confirmRenamePartition"
    >
      <p class="modal-hint">
        系统三分组可按习惯改名，保存后文案池等展示同步；系统分组不可删除。
      </p>
      <div class="modal-form">
        <label>分区名称</label>
        <Input
          v-model:value="renameForm.name"
          placeholder="例如：文案 / 基础信息 / 规格参数"
          allow-clear
          @press-enter="confirmRenamePartition"
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
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 12px;
  align-items: start;
  min-height: 0;
}

.zone-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.zone-other-side {
  position: sticky;
  top: 8px;
  align-self: start;
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.zone-other-side:not(.collapsed) {
  display: flex;
  flex-direction: column;
}

.zone-list.is-other-side {
  flex: 1;
  min-height: 240px;
  max-height: none;
  overflow: auto;
}

@media (max-width: 1100px) {
  .zone-board {
    grid-template-columns: 1fr;
  }

  .zone-other-side {
    position: static;
    max-height: none;
  }

  .zone-list.is-other-side {
    max-height: 420px;
  }
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

.zone-col.collapsed {
  padding-bottom: 6px;
}

.zone-col.is-attr {
  min-height: 0;
}

.zone-col.is-attr:not(.collapsed) {
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
  align-items: center;
  width: 100%;
  padding: 0;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.zone-col-h .caret {
  flex: 0 0 auto;
  width: 12px;
  font-size: 12px;
  color: var(--zone-color, #6b7280);
}

.zone-col-h b {
  flex: 1;
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
  gap: 0;
  min-height: 88px;
  max-height: 52vh;
  overflow: auto;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.zone-list.is-form {
  max-height: 420px;
}

.zone-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 8px;
}

.zone-tools :deep(.ant-input-affix-wrapper) {
  flex: 1;
}

.zh-switch {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
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
