<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqProductApi } from '#/api/xq/product';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
  TreeSelect,
} from 'ant-design-vue';

import {
  getXqListingCategories,
  getXqListingPlatforms,
  getXqListingShops,
} from '#/api/xq/listing';
import { getXqCategoryTree } from '#/api/xq/product';
import {
  batchCloseXqWorkOrder,
  batchGenerateXqWorkOrderCopy,
  closeXqWorkOrder,
  getXqWorkOrderPage,
} from '#/api/xq/work-order';

const router = useRouter();

const loading = ref(false);
const catLoading = ref(false);
const catOpen = ref(false);
const keyword = ref('');
const statusFilter = ref<number | undefined>(10);
const categoryTree = ref<XqProductApi.CategoryNode[]>([]);
const browseL1 = ref<null | XqProductApi.CategoryNode>(null);
const browseL2 = ref<null | XqProductApi.CategoryNode>(null);
const filterL1 = ref<null | XqProductApi.CategoryNode>(null);
const filterL2 = ref<null | XqProductApi.CategoryNode>(null);
const filterL3 = ref<null | XqProductApi.CategoryNode>(null);

const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(12);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});
const batching = ref(false);
const closing = ref(false);
let rpaPollTimer: null | ReturnType<typeof setInterval> = null;

const selectedCount = computed(() => Object.keys(selectedMap.value).length);
const selectedDoingCount = computed(
  () =>
    Object.values(selectedMap.value).filter((row) => row.status === 10).length,
);

const l2List = computed(() => browseL1.value?.children || []);
const l3List = computed(() => browseL2.value?.children || []);

const categoryLabel = computed(() => {
  const parts = [
    filterL1.value?.name,
    filterL2.value?.name,
    filterL3.value?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Categories 类别';
});

const filterCategoryId = computed(() => {
  return (
    filterL3.value?.id || filterL2.value?.id || filterL1.value?.id || undefined
  );
});

const queryParams = reactive({
  keyword: '' as string | undefined,
  gigaCategoryId: undefined as number | undefined,
  status: 10 as number | undefined,
  listingPlatformId: undefined as string | undefined,
  listingShopId: undefined as string | undefined,
  listingCategoryId: undefined as string | undefined,
});

const listingPlatforms = ref<XqListingApi.Platform[]>([]);
const listingShops = ref<XqListingApi.Shop[]>([]);
const listingCategoryTree = ref<XqListingApi.CategoryNode[]>([]);
const filterPlatformId = ref<string | undefined>();
const filterShopId = ref<string | undefined>();
const filterListingCategoryId = ref<string | undefined>();

const statusOptions = [
  { label: '进行中', value: 10 },
  { label: '已上架', value: 20 },
  { label: '已关闭', value: 30 },
];

const listingPlatformOptions = computed(() =>
  listingPlatforms.value.map((p) => ({ label: p.name, value: p.id })),
);
const listingShopOptions = computed(() =>
  listingShops.value.map((s) => ({ label: s.name, value: s.id })),
);
const listingCategoryTreeData = computed(() =>
  mapListingCategoryTree(listingCategoryTree.value),
);

function mapListingCategoryTree(
  nodes: XqListingApi.CategoryNode[],
): Array<Record<string, any>> {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: n.id,
    key: n.id,
    children: n.children?.length
      ? mapListingCategoryTree(n.children)
      : undefined,
  }));
}

function selectL1(item: XqProductApi.CategoryNode) {
  browseL1.value = item;
  browseL2.value = item.children?.[0] || null;
}

function selectL2(item: XqProductApi.CategoryNode) {
  browseL2.value = item;
}

function selectL3(item: XqProductApi.CategoryNode) {
  filterL1.value = browseL1.value;
  filterL2.value = browseL2.value;
  filterL3.value = item;
  catOpen.value = false;
}

function clearCategory() {
  filterL1.value = null;
  filterL2.value = null;
  filterL3.value = null;
}

function toggleCategoryPanel() {
  catOpen.value = !catOpen.value;
  if (catOpen.value && !browseL1.value && categoryTree.value.length > 0) {
    selectL1(categoryTree.value[0]!);
  }
}

async function loadCategories() {
  catLoading.value = true;
  try {
    categoryTree.value = (await getXqCategoryTree()) || [];
  } catch (error: any) {
    message.error(error?.message || '类目加载失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadListingPlatforms() {
  try {
    listingPlatforms.value = (await getXqListingPlatforms()) || [];
  } catch {
    listingPlatforms.value = [];
  }
}

async function onFilterPlatformChange(id?: string) {
  filterPlatformId.value = id;
  filterShopId.value = undefined;
  filterListingCategoryId.value = undefined;
  listingShops.value = [];
  listingCategoryTree.value = [];
  if (id) {
    try {
      const [shops, cats] = await Promise.all([
        getXqListingShops(id),
        getXqListingCategories(id),
      ]);
      listingShops.value = shops || [];
      listingCategoryTree.value = cats || [];
    } catch (error: any) {
      message.error(error?.message || '加载店铺/分类失败');
    }
  }
  handleSearch();
}

function hasPendingRpa(list: XqWorkOrderApi.WorkOrder[]) {
  return list.some((t) => t.rpaCopyStatus === 'running');
}

function stopRpaPoll() {
  if (rpaPollTimer) {
    clearInterval(rpaPollTimer);
    rpaPollTimer = null;
  }
}

function startRpaPoll() {
  if (rpaPollTimer) return;
  rpaPollTimer = setInterval(async () => {
    if (!hasPendingRpa(tasks.value)) {
      stopRpaPoll();
      return;
    }
    try {
      await loadTasks({ silent: true });
    } catch {
      // ignore poll errors
    }
  }, 5000);
}

async function loadTasks(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true;
  try {
    const kw = queryParams.keyword?.trim();
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: kw || undefined,
      status: queryParams.status,
      gigaCategoryId: queryParams.gigaCategoryId,
      listingPlatformId: queryParams.listingPlatformId,
      listingShopId: queryParams.listingShopId,
      listingCategoryId: queryParams.listingCategoryId,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
    if (hasPendingRpa(tasks.value)) startRpaPoll();
    else stopRpaPoll();
  } catch (error: any) {
    if (!opts?.silent) message.error(error?.message || '任务加载失败');
  } finally {
    if (!opts?.silent) loading.value = false;
  }
}

function handleSearch() {
  queryParams.keyword = keyword.value.trim() || undefined;
  queryParams.status = statusFilter.value;
  queryParams.listingPlatformId = filterPlatformId.value;
  queryParams.listingShopId = filterShopId.value;
  queryParams.listingCategoryId = filterListingCategoryId.value;
  pageNo.value = 1;
  loadTasks();
}

watch(filterCategoryId, (id) => {
  queryParams.gigaCategoryId = id;
  pageNo.value = 1;
  loadTasks();
});

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadTasks();
}

function isCopyReady(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.contentTitle?.trim());
}

function isImageReady(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.generatedImageUrl?.trim());
}

function stageText(row: XqWorkOrderApi.WorkOrder) {
  if (row.status === 20) return '已上架';
  if (row.status !== 10) return '已关闭';
  if (row.rpaCopyStatus === 'running') return '文案生成中';
  if (row.rpaCopyStatus === 'queued') return '待手动跑RPA';
  if (row.rpaCopyStatus === 'fail') return '文案失败';
  if (!isCopyReady(row)) return '待文案';
  if (!isImageReady(row)) return '待图片';
  const img = String(row.imageStatus || '').toLowerCase();
  if (img === 'done' || row.listingStatus === 'export_pending_confirm') {
    return '待上架';
  }
  if (img === 'generated' || img === 'revised') return '审核中';
  return '出图中';
}

function stageColor(row: XqWorkOrderApi.WorkOrder) {
  if (row.status === 20) return 'success';
  if (row.status !== 10) return 'default';
  if (row.rpaCopyStatus === 'fail') return 'error';
  if (row.rpaCopyStatus === 'running') return 'processing';
  if (row.rpaCopyStatus === 'queued') return 'warning';
  if (!isCopyReady(row)) return 'processing';
  if (!isImageReady(row)) return 'warning';
  return 'orange';
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.generatedImageUrl || row.coverUrl || undefined;
}

function isSelected(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.id && selectedMap.value[row.id]);
}

function toggleSelect(row: XqWorkOrderApi.WorkOrder, checked?: boolean) {
  if (!row.id) return;
  const id = row.id;
  const on = checked === undefined ? !selectedMap.value[id] : checked;
  selectedMap.value = on
    ? { ...selectedMap.value, [id]: row }
    : Object.fromEntries(
        Object.entries(selectedMap.value).filter(([k]) => Number(k) !== id),
      );
}

function clearSelection() {
  selectedMap.value = {};
}

async function batchGenerateCopy() {
  const ids = Object.values(selectedMap.value)
    .filter((row) => row.status === 10 && !row.parentWorkOrderId && row.id)
    .map((row) => Number(row.id))
    .filter((id) => !Number.isNaN(id));
  if (ids.length === 0) {
    message.warning('请勾选主体任务（变体不用跑文案）');
    return;
  }
  batching.value = true;
  try {
    const list = await batchGenerateXqWorkOrderCopy(ids);
    message.success(
      `已写入个人待跑 ${list?.length ?? ids.length} 条，请手动启动「文案生成」RPA 拉取 SKU`,
    );
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '批量生成失败');
  } finally {
    batching.value = false;
  }
}

function selectedDoingIds() {
  return Object.values(selectedMap.value)
    .filter((row): row is XqWorkOrderApi.WorkOrder & { id: number } => {
      return row.status === 10 && typeof row.id === 'number';
    })
    .map((row) => row.id);
}

function omitSelected(id: number) {
  const next: Record<number, XqWorkOrderApi.WorkOrder> = {};
  for (const [key, value] of Object.entries(selectedMap.value)) {
    if (Number(key) !== id) {
      next[Number(key)] = value;
    }
  }
  selectedMap.value = next;
}

async function closeOneTask(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id || row.status !== 10) return;
  Modal.confirm({
    title: '关闭并清理任务',
    content: `确认关闭「${row.externalSku || row.title || row.id}」？将清空文案、美工分配与生成图，并从「我的文案」移除；关闭后可同平台重新下发。`,
    okText: '关闭并清理',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await closeXqWorkOrder(row.id!);
        message.success('已关闭并清理进度');
        omitSelected(row.id!);
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '关闭失败');
        throw error;
      }
    },
  });
}

async function batchCloseTasks() {
  const ids = selectedDoingIds();
  if (ids.length === 0) {
    message.warning('请先勾选进行中的任务');
    return;
  }
  Modal.confirm({
    title: '批量关闭并清理',
    content: `确认关闭选中的 ${ids.length} 个任务？将清空文案、美工分配与生成图，并从「我的文案」移除；关闭后可同平台重新下发。`,
    okText: '关闭并清理',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      closing.value = true;
      try {
        const n = await batchCloseXqWorkOrder(ids);
        message.success(`已关闭并清理 ${n} 个任务`);
        clearSelection();
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '批量关闭失败');
        throw error;
      } finally {
        closing.value = false;
      }
    },
  });
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadListingPlatforms()]);
  await loadTasks();
});

onUnmounted(() => {
  stopRpaPoll();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-bench">
      <div class="xq-toolbar">
        <button
          class="xq-cat-trigger"
          type="button"
          :class="{ open: catOpen }"
          @click="toggleCategoryPanel"
        >
          <IconifyIcon icon="lucide:menu" class="xq-cat-trigger-icon" />
          <span class="xq-cat-trigger-text">{{ categoryLabel }}</span>
          <IconifyIcon
            :icon="catOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="xq-cat-trigger-arrow"
          />
        </button>
        <button
          v-if="filterL1 || filterL2 || filterL3"
          class="xq-cat-clear"
          type="button"
          @click="clearCategory"
        >
          清除筛选
        </button>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search-input"
          placeholder="搜索任务号 / Item Code / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
        <Select
          v-model:value="statusFilter"
          allow-clear
          class="xq-status-select"
          placeholder="状态"
          :options="statusOptions"
          @change="handleSearch"
        />
        <Select
          v-model:value="filterPlatformId"
          allow-clear
          show-search
          option-filter-prop="label"
          class="xq-listing-select"
          placeholder="上架平台"
          :options="listingPlatformOptions"
          @change="(v: any) => onFilterPlatformChange(v)"
        />
        <Select
          v-model:value="filterShopId"
          allow-clear
          show-search
          option-filter-prop="label"
          class="xq-listing-select"
          placeholder="上架店铺"
          :options="listingShopOptions"
          :disabled="!filterPlatformId"
          @change="handleSearch"
        />
        <TreeSelect
          v-model:value="filterListingCategoryId"
          allow-clear
          show-search
          tree-node-filter-prop="title"
          class="xq-listing-tree"
          placeholder="平台分类"
          :tree-data="listingCategoryTreeData"
          :disabled="!filterPlatformId"
          @change="handleSearch"
        />
        <Button
          type="primary"
          :disabled="selectedCount === 0"
          :loading="batching"
          @click="batchGenerateCopy"
        >
          批量生成文案{{ selectedCount ? ` (${selectedCount})` : '' }}
        </Button>
        <Button
          danger
          :disabled="selectedDoingCount === 0"
          :loading="closing"
          @click="batchCloseTasks"
        >
          批量关闭清理{{ selectedDoingCount ? ` (${selectedDoingCount})` : '' }}
        </Button>
        <Button v-if="selectedCount" @click="clearSelection">清空选择</Button>
        <Button
          type="link"
          @click="router.push('/xq-product/workspace/copy-pool')"
        >
          我的文案 →
        </Button>
      </div>

      <div v-show="catOpen" class="xq-cat-panel">
        <Spin :spinning="catLoading">
          <div v-if="categoryTree.length" class="category-cascader">
            <div class="col col-l1">
              <div
                v-for="item in categoryTree"
                :key="`l1-${item.id}`"
                class="l1-item"
                :class="{ active: browseL1?.id === item.id }"
                @mouseenter="selectL1(item)"
                @click="selectL1(item)"
              >
                <span class="name">{{ item.name }}</span>
                <span class="arrow">›</span>
              </div>
            </div>
            <div class="col col-l2">
              <div
                v-for="item in l2List"
                :key="`l2-${item.id}-${item.pathIds}`"
                class="l2-item"
                :class="{
                  active:
                    browseL2?.id === item.id &&
                    browseL2?.pathIds === item.pathIds,
                }"
                @mouseenter="selectL2(item)"
                @click="selectL2(item)"
              >
                <span
                  class="name"
                  :class="{ bold: browseL2?.id === item.id }"
                  >{{ item.name }}</span>
                <span v-if="item.children?.length" class="arrow">›</span>
              </div>
              <Empty
                v-if="!l2List.length"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无二级类目"
              />
            </div>
            <div class="col col-l3">
              <div class="l3-title">{{ browseL2?.name || '—' }}</div>
              <div v-if="l3List.length" class="l3-grid">
                <button
                  v-for="item in l3List"
                  :key="`l3-${item.id}-${item.pathIds}`"
                  class="l3-card"
                  :class="{ active: filterL3?.id === item.id }"
                  type="button"
                  @click="selectL3(item)"
                >
                  <div class="l3-avatar">
                    <img
                      v-if="item.imagePath"
                      :src="item.imagePath"
                      :alt="item.name"
                      loading="lazy"
                    />
                    <span v-else class="l3-fallback">{{
                      item.name?.slice(0, 1) || '?'
                    }}</span>
                  </div>
                  <div class="l3-name">{{ item.name }}</div>
                </button>
              </div>
              <Empty
                v-else
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无三级类目"
              />
            </div>
          </div>
          <Empty v-else-if="!catLoading" description="暂无类目数据" />
        </Spin>
      </div>

      <div class="xq-section-title">
        工作台
        <span class="xq-path">· 勾选任务后「批量生成文案」，再到「我的文案」分配美工</span>
      </div>

      <div class="xq-queue">
        <Spin :spinning="loading">
          <div v-if="tasks.length" class="xq-task-grid">
            <button
              v-for="row in tasks"
              :key="row.id"
              class="xq-task-card"
              type="button"
              :class="{ selected: isSelected(row) }"
              @click="toggleSelect(row, !isSelected(row))"
            >
              <div
                class="xq-card-check"
                @click.stop="toggleSelect(row, !isSelected(row))"
              >
                <Checkbox :checked="isSelected(row)" />
              </div>
              <span
                v-if="row.status === 10"
                class="xq-card-close"
                title="关闭任务"
                role="button"
                @click.stop="closeOneTask(row)"
              >
                ×
              </span>
              <div class="xq-card-cover">
                <Image
                  :src="coverOf(row)"
                  :preview="false"
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' text-anchor='middle' dy='.3em' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E"
                />
                <Tag class="xq-stage-badge" :color="stageColor(row)">
                  {{ stageText(row) }}
                </Tag>
              </div>
              <div class="xq-card-body">
                <div class="xq-item-code">
                  Item Code:
                  <b>{{ row.externalSku || '—' }}</b>
                </div>
                <div v-if="row.variants?.length" class="xq-listing-meta">
                  {{ row.variants.length }} 个变体
                </div>
                <div class="xq-title" :title="row.title">{{ row.title }}</div>
                <div
                  v-if="
                    row.listingPlatformName ||
                    row.listingShopName ||
                    row.listingCategoryName
                  "
                  class="xq-listing-meta"
                  :title="
                    [
                      row.listingPlatformName,
                      row.listingShopName,
                      row.listingCategoryName,
                    ]
                      .filter(Boolean)
                      .join(' / ')
                  "
                >
                  {{
                    [
                      row.listingPlatformName,
                      row.listingShopName,
                      row.listingCategoryName,
                    ]
                      .filter(Boolean)
                      .join(' / ')
                  }}
                </div>
                <div class="xq-ai-flags">
                  <span class="xq-ai-chip" :class="{ done: isCopyReady(row) }">
                    文案 {{ isCopyReady(row) ? '✓' : '1' }}
                  </span>
                  <span class="xq-ai-chip" :class="{ done: isImageReady(row) }">
                    图片 {{ isImageReady(row) ? '✓' : '2' }}
                  </span>
                  <span class="xq-ai-chip" :class="{ done: row.status === 20 }">
                    上架 {{ row.status === 20 ? '✓' : '3' }}
                  </span>
                </div>
              </div>
            </button>
          </div>
          <Empty
            v-else
            description="暂无任务，请先从选品库下发"
            class="xq-empty"
          />
        </Spin>

        <div v-if="total > 0" class="xq-pager">
          <Pagination
            :current="pageNo"
            :page-size="pageSize"
            :total="total"
            size="small"
            show-size-changer
            :page-size-options="['12', '20', '40']"
            @change="onPageChange"
          />
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.xq-bench {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 4px 2px 16px;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.xq-cat-trigger {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  max-width: 360px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #111;
  border: 0;
  border-radius: 6px;
}

.xq-cat-trigger.open {
  background: #333;
}

.xq-cat-trigger-icon,
.xq-cat-trigger-arrow {
  flex: none;
  color: #fff;
}

.xq-cat-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  white-space: nowrap;
}

.xq-cat-clear {
  padding: 8px 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.xq-search-input {
  flex: 1;
  min-width: 220px;
  max-width: 420px;
}

.xq-listing-select {
  min-width: 140px;
}

.xq-listing-tree {
  min-width: 180px;
}

.xq-listing-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.xq-status-select {
  width: 140px;
}

.category-cascader {
  display: grid;
  grid-template-columns: 240px 260px 1fr;
  min-height: 360px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.col {
  max-height: 420px;
  overflow: auto;
}

.col-l1 {
  padding: 12px 0;
  background: #fafafa;
  border-right: 1px solid #eee;
}

.col-l2 {
  padding: 8px 0;
  border-right: 1px solid #eee;
}

.col-l3 {
  padding: 12px 16px 16px;
}

.l1-item,
.l2-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
}

.l1-item:hover,
.l2-item:hover,
.l1-item.active,
.l2-item.active {
  background: #f0f7ff;
}

.l1-item .name,
.l2-item .name {
  font-size: 13px;
  color: #222;
}

.l2-item .name.bold {
  font-weight: 700;
}

.l1-item .arrow,
.l2-item .arrow {
  color: #bbb;
}

.l3-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
}

.l3-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.l3-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 10px 8px;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
}

.l3-card:hover,
.l3-card.active {
  background: #f8fbff;
  border-color: #91caff;
}

.l3-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 10px;
}

.l3-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.l3-fallback {
  font-size: 20px;
  color: #9ca3af;
}

.l3-name {
  max-width: 140px;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
}

.xq-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.xq-path {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.xq-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.xq-task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.xq-task-card {
  position: relative;
  padding: 0;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.xq-task-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  transform: translateY(-2px);
}

.xq-task-card.selected {
  border-color: #1677ff;
  box-shadow: 0 6px 18px rgb(22 119 255 / 14%);
}

.xq-card-close {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  background: rgb(255 255 255 / 92%);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
}

.xq-card-close:hover {
  color: #fff;
  background: #ef4444;
  border-color: #ef4444;
}

.xq-card-check {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 2px 4px;
  line-height: 1;
  background: rgb(255 255 255 / 92%);
  border-radius: 6px;
}

.xq-card-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  pointer-events: none;
  background: #f8fafc;
}

.xq-card-cover :deep(.ant-image),
.xq-card-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-stage-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  margin: 0;
}

.xq-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
}

.xq-item-code {
  font-size: 12px;
  color: #111;
}

.xq-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
}

.xq-ai-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.xq-ai-chip {
  padding: 1px 6px;
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 999px;
}

.xq-ai-chip.done {
  color: #15803d;
  background: #dcfce7;
}

.xq-pager {
  display: flex;
  justify-content: flex-end;
}

.xq-empty {
  padding: 32px 0;
}
</style>
