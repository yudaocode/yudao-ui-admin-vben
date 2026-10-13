<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqListingApi, XqSpecialConfigApi } from '#/api/xq/listing';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Table,
  TabPane,
  Tabs,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { getSimpleUserList } from '#/api/system/user';
import {
  deleteXqPriceMarkupRule,
  deleteXqSkuRule,
  deleteXqUpcRule,
  getXqListingShops,
  getXqPriceMarkupRules,
  getXqSkuRules,
  getXqUpcPoolPage,
  getXqUpcPoolStats,
  getXqUpcRules,
  importXqUpcPool,
  releaseXqUpcPoolItem,
  saveXqPriceMarkupRule,
  saveXqSkuRule,
  saveXqUpcRule,
  voidXqUpcPoolItem,
} from '#/api/xq/listing';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

type SkuSegment = XqSpecialConfigApi.SkuSegment;

const lockedPlatformId = useDeskPlatformId();
const shops = ref<XqListingApi.Shop[]>([]);
const users = ref<SystemUserApi.User[]>([]);
const activeTab = ref('sku');
const skuShopFilter = ref('');
const markupShopFilter = ref('');

const skuLoading = ref(false);
const skuRules = ref<XqSpecialConfigApi.SkuRule[]>([]);
const skuModal = ref(false);
const skuSaving = ref(false);
const skuForm = reactive(emptySkuForm());

const markupLoading = ref(false);
const markupRules = ref<XqSpecialConfigApi.MarkupRule[]>([]);
const markupModal = ref(false);
const markupSaving = ref(false);
const markupForm = reactive(emptyMarkupForm());

const upcLoading = ref(false);
const upcRules = ref<XqSpecialConfigApi.UpcRule[]>([]);
const upcModal = ref(false);
const upcSaving = ref(false);
const upcForm = reactive(emptyUpcForm());

const poolLoading = ref(false);
const poolType = ref<'free' | 'paid'>('free');
const poolStatus = ref('');
const poolPage = ref(1);
const poolPageSize = ref(20);
const poolTotal = ref(0);
const poolRows = ref<XqSpecialConfigApi.UpcPoolItem[]>([]);
const poolStats = ref<XqSpecialConfigApi.UpcPoolStats>({});
const importModal = ref(false);
const importSaving = ref(false);
const importType = ref<'free' | 'paid'>('paid');
const importText = ref('');

const SEGMENT_TYPES = [
  { value: 'text', label: '固定文本' },
  { value: 'shopCode', label: '店铺编码' },
  { value: 'ownerInitials', label: '运营姓名首字母' },
  { value: 'date', label: '日期' },
  { value: 'seq', label: '序号' },
  { value: 'randomDigits', label: '随机数' },
];

const skuColumns = [
  { title: '店铺', key: 'shop', width: 140 },
  { title: '运营', key: 'owner', width: 120 },
  { title: '规则名称', dataIndex: 'name' },
  { title: '拼装', key: 'segs' },
  { title: '示例', key: 'example', width: 180 },
  { title: '状态', key: 'status', width: 130 },
  { title: '操作', key: 'action', width: 180 },
];
const markupColumns = [
  { title: '店铺', dataIndex: 'shopName', width: 140 },
  { title: '运营', key: 'owner', width: 120 },
  { title: '规则名称', dataIndex: 'name' },
  { title: '类型', key: 'mode', width: 110 },
  { title: '公式', dataIndex: 'summary' },
  { title: '示例(货价100)', key: 'sample', width: 130 },
  { title: '作用', key: 'applyTo', width: 110 },
  { title: '状态', key: 'status', width: 110 },
  { title: '操作', key: 'action', width: 180 },
];
const upcColumns = [
  { title: '规则名称', dataIndex: 'name' },
  { title: '模式', key: 'mode', width: 120 },
  { title: '摘要', key: 'summary' },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 120 },
];
const poolColumns = [
  { title: 'UPC', dataIndex: 'upc', width: 160 },
  { title: '类型', key: 'poolType', width: 90 },
  { title: '状态', key: 'status', width: 100 },
  { title: '占用人', dataIndex: 'claimedByName' },
  { title: '操作', key: 'action', width: 140 },
];

const shopOptions = computed(() =>
  shops.value.map((s) => ({ label: s.name, value: s.id })),
);
const userOptions = computed(() =>
  users.value.map((u) => ({
    label: u.nickname || u.username,
    value: String(u.id),
  })),
);

function emptySkuForm() {
  return {
    id: '',
    shopId: '',
    ownerUserId: '',
    name: '',
    enabled: true,
    skipSku: false,
    isDefault: false,
    segments: [] as SkuSegment[],
  };
}

function emptyMarkupForm() {
  return {
    id: '',
    shopId: '',
    ownerUserId: '',
    name: '',
    mode: 'percent',
    value: 175,
    freightRate: 0.85,
    applyTo: 'both',
    enabled: true,
    isDefault: false,
  };
}

function emptyUpcForm() {
  return {
    id: '',
    name: '',
    mode: 'pool',
    flagDigit: '0',
    manufacturerCode: '',
    productWidth: 5,
    productStart: 1,
    enabled: true,
  };
}

async function loadShops() {
  const pid = lockedPlatformId.value;
  if (!pid) return;
  shops.value = (await getXqListingShops(pid)) || [];
}

async function loadUsers() {
  users.value = (await getSimpleUserList()) || [];
}

async function loadSku() {
  const pid = lockedPlatformId.value;
  if (!pid) return;
  skuLoading.value = true;
  try {
    skuRules.value =
      (await getXqSkuRules(pid, skuShopFilter.value || undefined)) || [];
  } finally {
    skuLoading.value = false;
  }
}

async function loadMarkup() {
  const pid = lockedPlatformId.value;
  if (!pid) return;
  markupLoading.value = true;
  try {
    markupRules.value =
      (await getXqPriceMarkupRules(pid, markupShopFilter.value || undefined)) ||
      [];
  } finally {
    markupLoading.value = false;
  }
}

async function loadUpc() {
  const pid = lockedPlatformId.value;
  if (!pid) return;
  upcLoading.value = true;
  try {
    upcRules.value = (await getXqUpcRules(pid)) || [];
    poolStats.value = (await getXqUpcPoolStats()) || {};
  } finally {
    upcLoading.value = false;
  }
}

async function loadPool() {
  poolLoading.value = true;
  try {
    const res = await getXqUpcPoolPage({
      poolType: poolType.value,
      status: poolStatus.value || undefined,
      pageNo: poolPage.value,
      pageSize: poolPageSize.value,
    });
    poolRows.value = res?.list || [];
    poolTotal.value = Number(res?.total || 0);
    poolStats.value = (await getXqUpcPoolStats()) || {};
  } finally {
    poolLoading.value = false;
  }
}

function onPoolTableChange(p: { current?: number; pageSize?: number }) {
  poolPage.value = p.current || 1;
  poolPageSize.value = p.pageSize || 20;
  loadPool();
}

async function loadTab(key: string) {
  if (key === 'sku') await loadSku();
  else if (key === 'markup') await loadMarkup();
  else await Promise.all([loadUpc(), loadPool()]);
}

function segmentLabel(seg: SkuSegment) {
  const hit = SEGMENT_TYPES.find((t) => t.value === seg.type);
  const typeLabel = hit?.label || seg.type;
  if (seg.type === 'text') return `${typeLabel}·${seg.value || '?'}`;
  if (seg.type === 'date') return `${typeLabel}·${seg.format || 'YYYYMMDD'}`;
  if (seg.type === 'seq') return `${typeLabel}·${seg.width || 3}位`;
  if (seg.type === 'randomDigits') return `${typeLabel}·${seg.width || 5}位`;
  return typeLabel;
}

function skuExample(row: XqSpecialConfigApi.SkuRule) {
  if (row.skipSku) return '不生成';
  const shop = shops.value.find((s) => s.id === row.shopId)?.name || 'SHOP';
  const owner =
    users.value.find((u) => String(u.id) === String(row.ownerUserId || ''))
      ?.nickname || 'xx';
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  return (row.segments || [])
    .map((seg) => {
      if (seg.type === 'text') return seg.value || '';
      if (seg.type === 'shopCode') return shop;
      if (seg.type === 'ownerInitials') return owner.slice(0, 2);
      if (seg.type === 'date') return ymd;
      if (seg.type === 'seq')
        return String(seg.start || 1).padStart(seg.width || 3, '0');
      if (seg.type === 'randomDigits') return ''.padStart(seg.width || 5, '0');
      return '';
    })
    .join('');
}

function markupModeLabel(mode?: string) {
  if (mode === 'fixed') return '固定金额';
  if (mode === 'ratio') return '比例增幅';
  return '百分比';
}

function applyToLabel(v?: string) {
  if (v === 'dropship') return '仅代发';
  if (v === 'pickup') return '仅自提';
  return '代发+自提';
}

function upcModeLabel(mode?: string) {
  if (mode === 'auto') return '算法自生成';
  if (mode === 'pool') return '库存池';
  return '不生成';
}

function statusLabel(s?: string) {
  if (s === 'used') return '已占用';
  if (s === 'void') return '已作废';
  return '可用';
}

function openSku(row?: XqSpecialConfigApi.SkuRule) {
  Object.assign(skuForm, emptySkuForm());
  if (row) {
    Object.assign(skuForm, {
      id: row.id || '',
      shopId: row.shopId || '',
      ownerUserId: row.ownerUserId || '',
      name: row.name || '',
      enabled: row.enabled !== false,
      skipSku: !!row.skipSku,
      isDefault: !!row.isDefault,
      segments: (row.segments || []).map((s) => ({ ...s })),
    });
  } else if (shops.value[0]) {
    skuForm.shopId = shops.value[0].id;
    // 新建：同店尚无默认时，勾上默认
    skuForm.isDefault = !skuRules.value.some(
      (r) => r.shopId === skuForm.shopId && r.isDefault,
    );
  }
  skuModal.value = true;
}

async function setSkuDefault(row: XqSpecialConfigApi.SkuRule) {
  if (!row.id || row.isDefault) return;
  try {
    await saveXqSkuRule({
      ...row,
      platformId: lockedPlatformId.value,
      isDefault: true,
    });
    message.success('已设为该店铺默认 SKU 规则');
    await loadSku();
  } catch (error: any) {
    message.error(error?.message || '设置失败');
  }
}

function addSegment(type: string) {
  const seg: SkuSegment = { type };
  if (type === 'text') seg.value = '';
  if (type === 'date') seg.format = 'YYYYMMDD';
  if (type === 'seq') {
    seg.width = 3;
    seg.start = 1;
  }
  if (type === 'randomDigits') seg.width = 5;
  skuForm.segments.push(seg);
}

async function submitSku() {
  if (!skuForm.shopId) {
    message.warning('请选择店铺');
    return;
  }
  if (!skuForm.skipSku && skuForm.segments.length === 0) {
    message.warning('请至少加一段 SKU 规则');
    return;
  }
  skuSaving.value = true;
  try {
    await saveXqSkuRule({
      ...skuForm,
      platformId: lockedPlatformId.value,
      ownerUserId: skuForm.ownerUserId || '',
    });
    message.success('SKU 规则已保存');
    skuModal.value = false;
    await loadSku();
  } finally {
    skuSaving.value = false;
  }
}

async function removeSku(row: XqSpecialConfigApi.SkuRule) {
  Modal.confirm({
    title: '删除 SKU 规则？',
    content: row.name || '',
    onOk: async () => {
      await deleteXqSkuRule(String(row.id));
      message.success('已删除');
      await loadSku();
    },
  });
}

function openMarkup(row?: XqSpecialConfigApi.MarkupRule) {
  Object.assign(markupForm, emptyMarkupForm());
  if (row) {
    Object.assign(markupForm, {
      id: row.id || '',
      shopId: row.shopId || '',
      ownerUserId: row.ownerUserId || '',
      name: row.name || '',
      mode: row.mode || 'percent',
      value: Number(row.value ?? 175),
      freightRate: Number(row.freightRate ?? 0.85),
      applyTo: row.applyTo || 'both',
      enabled: row.enabled !== false,
      isDefault: !!row.isDefault,
    });
  } else if (shops.value[0]) {
    markupForm.shopId = shops.value[0].id;
    markupForm.isDefault = !markupRules.value.some(
      (r) => r.shopId === markupForm.shopId && r.isDefault,
    );
  }
  markupModal.value = true;
}

async function setMarkupDefault(row: XqSpecialConfigApi.MarkupRule) {
  if (!row.id || row.isDefault) return;
  try {
    await saveXqPriceMarkupRule({
      ...row,
      platformId: lockedPlatformId.value,
      isDefault: true,
    });
    message.success('已设为该店铺默认价格规则');
    await loadMarkup();
  } catch (error: any) {
    message.error(error?.message || '设置失败');
  }
}

const markupSample = computed(() => {
  const b = 100;
  const v = Number(markupForm.value);
  const r = Number(markupForm.freightRate) || 0.85;
  if (!Number.isFinite(v) || r <= 0) return '—';
  let marked: number;
  if (markupForm.mode === 'fixed') marked = b + v;
  else if (markupForm.mode === 'percent') marked = b * (v / 100);
  else marked = b * v;
  return String(Math.round((marked / r) * 100) / 100);
});

async function submitMarkup() {
  if (!markupForm.shopId) {
    message.warning('请选择店铺');
    return;
  }
  markupSaving.value = true;
  try {
    await saveXqPriceMarkupRule({
      ...markupForm,
      platformId: lockedPlatformId.value,
      ownerUserId: markupForm.ownerUserId || '',
    });
    message.success('价格增幅已保存');
    markupModal.value = false;
    await loadMarkup();
  } finally {
    markupSaving.value = false;
  }
}

async function removeMarkup(row: XqSpecialConfigApi.MarkupRule) {
  Modal.confirm({
    title: '删除价格增幅规则？',
    content: row.name || '',
    onOk: async () => {
      await deleteXqPriceMarkupRule(String(row.id));
      message.success('已删除');
      await loadMarkup();
    },
  });
}

function openUpc(row?: XqSpecialConfigApi.UpcRule) {
  Object.assign(upcForm, emptyUpcForm());
  if (row) {
    Object.assign(upcForm, {
      id: row.id || '',
      name: row.name || '',
      mode: row.mode || 'pool',
      flagDigit: row.flagDigit || '0',
      manufacturerCode: row.manufacturerCode || '',
      productWidth: row.productWidth || 5,
      productStart: row.productStart || 1,
      enabled: row.enabled !== false,
    });
  }
  upcModal.value = true;
}

async function submitUpc() {
  upcSaving.value = true;
  try {
    await saveXqUpcRule({
      ...upcForm,
      platformId: lockedPlatformId.value,
      shopId: '',
    });
    message.success('UPC 规则已保存');
    upcModal.value = false;
    await loadUpc();
  } finally {
    upcSaving.value = false;
  }
}

async function removeUpc(row: XqSpecialConfigApi.UpcRule) {
  Modal.confirm({
    title: '删除 UPC 规则？',
    content: row.name || '',
    onOk: async () => {
      await deleteXqUpcRule(String(row.id));
      message.success('已删除');
      await loadUpc();
    },
  });
}

async function submitImport() {
  if (!importText.value.trim()) {
    message.warning('请粘贴 UPC');
    return;
  }
  importSaving.value = true;
  try {
    const res = await importXqUpcPool({
      poolType: importType.value,
      text: importText.value,
    });
    message.success(
      `导入 ${res.imported}，跳过 ${res.skipped}，无效 ${res.invalid?.length || 0}`,
    );
    importModal.value = false;
    importText.value = '';
    await loadPool();
    await loadUpc();
  } finally {
    importSaving.value = false;
  }
}

async function voidItem(row: XqSpecialConfigApi.UpcPoolItem) {
  await voidXqUpcPoolItem(row.id);
  message.success('已作废');
  await loadPool();
}

async function releaseItem(row: XqSpecialConfigApi.UpcPoolItem) {
  await releaseXqUpcPoolItem(row.id);
  message.success('已释放回池');
  await loadPool();
}

watch(skuShopFilter, () => loadSku());
watch(markupShopFilter, () => loadMarkup());
watch(activeTab, (key) => loadTab(key));
watch([poolType, poolStatus], () => {
  poolPage.value = 1;
  if (activeTab.value === 'upc') loadPool();
});

onMounted(async () => {
  await Promise.all([loadShops(), loadUsers()]);
  await loadTab(activeTab.value);
});
</script>

<template>
  <Page>
    <div class="xq-special">
      <Tabs v-model:active-key="activeTab" class="tabs">
        <TabPane key="sku" tab="SKU">
          <div class="toolbar">
            <span class="hint"
              >按店铺+运营拼装，空运营为店铺通用。已禁止原 SKU。</span
            >
            <Select
              v-model:value="skuShopFilter"
              allow-clear
              placeholder="全部店铺"
              style="width: 180px"
              :options="shopOptions"
            />
            <Button type="primary" @click="openSku()">新增规则</Button>
          </div>
          <Table
            :columns="skuColumns"
            :data-source="skuRules"
            :loading="skuLoading"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'shop'">
                {{ record.shopName || '需补店铺' }}
              </template>
              <template v-else-if="column.key === 'owner'">
                <Tag v-if="!record.ownerUserId">店铺通用</Tag>
                <span v-else>{{
                  record.ownerUserName || record.ownerUserId
                }}</span>
              </template>
              <template v-else-if="column.key === 'segs'">
                <Tag
                  v-for="(seg, i) in record.segments || []"
                  :key="`${record.id}-${i}`"
                  class="seg"
                >
                  {{ segmentLabel(seg) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'example'">
                <code>{{ skuExample(record) }}</code>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag v-if="record.isDefault" color="blue">默认</Tag>
                <Tag v-if="record.skipSku" color="orange">不生成</Tag>
                <Tag v-else :color="record.enabled ? 'green' : 'default'">
                  {{ record.enabled ? '启用' : '停用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" @click="openSku(record)">编辑</Button>
                <Button
                  v-if="!record.isDefault"
                  type="link"
                  @click="setSkuDefault(record)"
                >
                  设默认
                </Button>
                <Button type="link" danger @click="removeSku(record)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="markup" tab="价格增幅">
          <div class="toolbar">
            <span class="hint"
              >售价 = 增幅后货价 ÷ 运费系数（默认
              0.85）。例：100×175%÷0.85=205</span
            >
            <Select
              v-model:value="markupShopFilter"
              allow-clear
              placeholder="全部店铺"
              style="width: 180px"
              :options="shopOptions"
            />
            <Button type="primary" @click="openMarkup()">新增规则</Button>
          </div>
          <Table
            :columns="markupColumns"
            :data-source="markupRules"
            :loading="markupLoading"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'owner'">
                <Tag v-if="!record.ownerUserId">店铺通用</Tag>
                <span v-else>{{
                  record.ownerUserName || record.ownerUserId
                }}</span>
              </template>
              <template v-else-if="column.key === 'mode'">
                {{ markupModeLabel(record.mode) }}
              </template>
              <template v-else-if="column.key === 'sample'">
                <code>{{ record.samplePrice ?? '—' }}</code>
              </template>
              <template v-else-if="column.key === 'applyTo'">
                {{ applyToLabel(record.applyTo) }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag v-if="record.isDefault" color="blue">默认</Tag>
                <Tag :color="record.enabled ? 'green' : 'default'">
                  {{ record.enabled ? '启用' : '停用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" @click="openMarkup(record)">编辑</Button>
                <Button
                  v-if="!record.isDefault"
                  type="link"
                  @click="setMarkupDefault(record)"
                >
                  设默认
                </Button>
                <Button type="link" danger @click="removeMarkup(record)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="upc" tab="UPC 池">
          <div class="toolbar">
            <span class="hint">
              全局共用 · 免费 {{ poolStats.freeAvailable ?? 0 }} · 付费
              {{ poolStats.paidAvailable ?? 0 }} · 已用
              {{ poolStats.used ?? 0 }}
            </span>
            <Select
              v-model:value="poolType"
              style="width: 120px"
              :options="[
                { label: '免费池', value: 'free' },
                { label: '付费池', value: 'paid' },
              ]"
            />
            <Select
              v-model:value="poolStatus"
              allow-clear
              placeholder="全部状态"
              style="width: 120px"
              :options="[
                { label: '可用', value: 'available' },
                { label: '已占用', value: 'used' },
                { label: '已作废', value: 'void' },
              ]"
            />
            <Button @click="openUpc(upcRules[0])">
              {{ upcRules[0] ? 'UPC 规则' : '新增规则' }}
            </Button>
            <Button type="primary" @click="importModal = true">导入</Button>
          </div>
          <Table
            v-if="upcRules.length"
            :columns="upcColumns"
            :data-source="upcRules"
            :loading="upcLoading"
            :pagination="false"
            row-key="id"
            size="small"
            class="upc-rule-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'mode'">
                {{ upcModeLabel(record.mode) }}
              </template>
              <template v-else-if="column.key === 'summary'">
                <span v-if="record.mode === 'auto'">
                  旗码 {{ record.flagDigit }} / 厂商
                  {{ record.manufacturerCode }} / 位宽
                  {{ record.productWidth }} / 起始 {{ record.productStart }}
                </span>
                <span v-else-if="record.mode === 'pool'">库存池领取</span>
                <span v-else>—</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.enabled ? 'green' : 'default'">
                  {{ record.enabled ? '启用' : '停用' }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Button type="link" @click="openUpc(record)">编辑</Button>
                <Button type="link" danger @click="removeUpc(record)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
          <Table
            :columns="poolColumns"
            :data-source="poolRows"
            :loading="poolLoading"
            :pagination="{
              current: poolPage,
              pageSize: poolPageSize,
              total: poolTotal,
              showSizeChanger: true,
            }"
            row-key="id"
            size="small"
            @change="onPoolTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'poolType'">
                {{ record.poolType === 'free' ? '免费' : '付费' }}
              </template>
              <template v-else-if="column.key === 'status'">
                {{ statusLabel(record.status) }}
              </template>
              <template v-else-if="column.key === 'action'">
                <Button
                  v-if="record.status === 'used'"
                  type="link"
                  @click="releaseItem(record)"
                >
                  释放
                </Button>
                <Button
                  v-else-if="record.status !== 'void'"
                  type="link"
                  danger
                  @click="voidItem(record)"
                >
                  作废
                </Button>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </div>

    <Modal
      v-model:open="skuModal"
      :title="skuForm.id ? '编辑 SKU 规则' : '新增 SKU 规则'"
      :confirm-loading="skuSaving"
      width="720px"
      @ok="submitSku"
    >
      <div class="form">
        <label>店铺</label>
        <Select v-model:value="skuForm.shopId" :options="shopOptions" />
        <label>运营（空=店铺通用）</label>
        <Select
          v-model:value="skuForm.ownerUserId"
          allow-clear
          :options="userOptions"
          placeholder="店铺通用"
        />
        <label>规则名称</label>
        <Input
          v-model:value="skuForm.name"
          placeholder="可空，保存时自动生成"
        />
        <label>不生成 SKU</label>
        <Switch v-model:checked="skuForm.skipSku" />
        <label>启用</label>
        <Switch v-model:checked="skuForm.enabled" />
        <label>设为店铺默认</label>
        <Switch v-model:checked="skuForm.isDefault" />
        <template v-if="!skuForm.skipSku">
          <label>规则段</label>
          <div class="seg-add">
            <Button
              v-for="t in SEGMENT_TYPES"
              :key="t.value"
              size="small"
              @click="addSegment(t.value)"
            >
              + {{ t.label }}
            </Button>
          </div>
          <div v-for="(seg, i) in skuForm.segments" :key="i" class="seg-row">
            <Tag>{{ segmentLabel(seg) }}</Tag>
            <Input
              v-if="seg.type === 'text'"
              v-model:value="seg.value"
              placeholder="固定文本"
            />
            <Input
              v-else-if="seg.type === 'date'"
              v-model:value="seg.format"
              placeholder="YYYYMMDD"
            />
            <InputNumber
              v-else-if="seg.type === 'seq' || seg.type === 'randomDigits'"
              v-model:value="seg.width"
              :min="seg.type === 'randomDigits' ? 4 : 1"
              :max="seg.type === 'randomDigits' ? 8 : 12"
            />
            <Button type="link" danger @click="skuForm.segments.splice(i, 1)">
              删
            </Button>
          </div>
        </template>
      </div>
    </Modal>

    <Modal
      v-model:open="markupModal"
      :title="markupForm.id ? '编辑价格增幅' : '新增价格增幅'"
      :confirm-loading="markupSaving"
      width="560px"
      @ok="submitMarkup"
    >
      <div class="form">
        <label>店铺</label>
        <Select v-model:value="markupForm.shopId" :options="shopOptions" />
        <label>运营（空=店铺通用）</label>
        <Select
          v-model:value="markupForm.ownerUserId"
          allow-clear
          :options="userOptions"
          placeholder="店铺通用"
        />
        <label>规则名称</label>
        <Input v-model:value="markupForm.name" />
        <label>增幅类型</label>
        <Select
          v-model:value="markupForm.mode"
          :options="[
            { label: '百分比', value: 'percent' },
            { label: '固定金额', value: 'fixed' },
            { label: '比例增幅', value: 'ratio' },
          ]"
        />
        <label>数值</label>
        <InputNumber v-model:value="markupForm.value" :min="0" :step="0.01" />
        <label>运费系数</label>
        <InputNumber
          v-model:value="markupForm.freightRate"
          :min="0.01"
          :step="0.01"
        />
        <label>作用价格</label>
        <Select
          v-model:value="markupForm.applyTo"
          :options="[
            { label: '代发+自提', value: 'both' },
            { label: '仅代发', value: 'dropship' },
            { label: '仅自提', value: 'pickup' },
          ]"
        />
        <label>启用</label>
        <Switch v-model:checked="markupForm.enabled" />
        <label>设为店铺默认</label>
        <Switch v-model:checked="markupForm.isDefault" />
        <p class="hint">货价 100 示例售价：{{ markupSample }}</p>
      </div>
    </Modal>

    <Modal
      v-model:open="upcModal"
      :title="upcForm.id ? '编辑 UPC 规则' : '新增 UPC 规则'"
      :confirm-loading="upcSaving"
      width="520px"
      @ok="submitUpc"
    >
      <div class="form">
        <label>规则名称</label>
        <Input v-model:value="upcForm.name" />
        <label>模式</label>
        <Select
          v-model:value="upcForm.mode"
          :options="[
            { label: '库存池', value: 'pool' },
            { label: '算法自生成', value: 'auto' },
            { label: '不生成', value: 'none' },
          ]"
        />
        <template v-if="upcForm.mode === 'auto'">
          <label>旗码</label>
          <Input v-model:value="upcForm.flagDigit" />
          <label>厂商代码</label>
          <Input v-model:value="upcForm.manufacturerCode" />
          <label>产品位宽</label>
          <InputNumber v-model:value="upcForm.productWidth" :min="1" :max="6" />
          <label>起始序号</label>
          <InputNumber v-model:value="upcForm.productStart" :min="0" />
        </template>
        <label>启用</label>
        <Switch v-model:checked="upcForm.enabled" />
      </div>
    </Modal>

    <Modal
      v-model:open="importModal"
      title="导入 UPC"
      :confirm-loading="importSaving"
      @ok="submitImport"
    >
      <div class="form">
        <label>池类型</label>
        <Select
          v-model:value="importType"
          :options="[
            { label: '付费池', value: 'paid' },
            { label: '免费池', value: 'free' },
          ]"
        />
        <label>UPC 列表</label>
        <Textarea
          v-model:value="importText"
          :rows="10"
          placeholder="每行一条 12 位 UPC，也可用空格/逗号分隔"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-special {
  padding: 8px 16px 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.hint {
  flex: 1;
  min-width: 200px;
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.upc-rule-table {
  margin-bottom: 12px;
}

.seg {
  margin: 0 4px 4px 0;
}

.seg-add,
.seg-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.form {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px 12px;
  align-items: center;
}

.form .seg-add,
.form .seg-row,
.form .hint {
  grid-column: 1 / -1;
}

.form .hint {
  font-size: 13px;
  color: #6b7280;
}
</style>
