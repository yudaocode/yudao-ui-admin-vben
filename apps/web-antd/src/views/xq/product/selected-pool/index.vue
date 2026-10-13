<script lang="ts" setup>
import type { XqListingApi, XqWorkbenchPlatform } from '#/api/xq/listing';
import type { XqProductApi } from '#/api/xq/product';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

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
  getXqWorkbenchScope,
} from '#/api/xq/listing';
import { getXqCategoryTree } from '#/api/xq/product';
import {
  bindXqWorkOrderListing,
  getXqWorkOrderPage,
} from '#/api/xq/work-order';

defineOptions({ name: 'XqSelectedPool' });

const loading = ref(false);
const binding = ref(false);
const catLoading = ref(false);
const keyword = ref('');
/** 大健云仓类目筛选（gigaId） */
const gigaCategoryId = ref<number | undefined>();
const gigaCategoryTree = ref<XqProductApi.CategoryNode[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});

const bindOpen = ref(false);
const scopePlatforms = ref<XqWorkbenchPlatform[]>([]);
const platforms = ref<XqListingApi.Platform[]>([]);
const shops = ref<XqListingApi.Shop[]>([]);
const categories = ref<XqListingApi.CategoryNode[]>([]);
const bindForm = reactive({
  listingPlatformId: undefined as string | undefined,
  listingShopId: undefined as string | undefined,
  listingCategoryId: undefined as string | undefined,
});

const selectedCount = computed(() => Object.keys(selectedMap.value).length);

const platformOptions = computed(() =>
  platforms.value.map((p) => ({ label: p.name, value: String(p.id) })),
);
const shopOptions = computed(() =>
  shops.value
    .filter(
      (s) =>
        !bindForm.listingPlatformId ||
        String(s.platformId) === String(bindForm.listingPlatformId),
    )
    .map((s) => ({ label: s.name, value: String(s.id) })),
);
const categoryTreeData = computed(() => mapCatTree(categories.value));
const gigaCategoryTreeData = computed(() =>
  mapGigaCatTree(gigaCategoryTree.value),
);

function mapCatTree(
  nodes: XqListingApi.CategoryNode[],
): Array<{ children?: any[]; title: string; value: string }> {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: String(n.id),
    children: n.children?.length ? mapCatTree(n.children) : undefined,
  }));
}

function mapGigaCatTree(
  nodes: XqProductApi.CategoryNode[],
): Array<{ children?: any[]; title: string; value: number }> {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: Number(n.gigaId || n.id),
    children: n.children?.length ? mapGigaCatTree(n.children) : undefined,
  }));
}

function findCatName(
  nodes: XqListingApi.CategoryNode[],
  id?: string,
): string | undefined {
  if (!id) return undefined;
  for (const n of nodes || []) {
    if (String(n.id) === String(id)) return n.name;
    const hit = findCatName(n.children || [], id);
    if (hit) return hit;
  }
  return undefined;
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.coverUrl || row.generatedImageUrl || '';
}

function isChecked(id?: number) {
  return id !== undefined && id !== null && Boolean(selectedMap.value[id]);
}

function toggleSelect(row: XqWorkOrderApi.WorkOrder, checked: boolean) {
  if (!row.id) return;
  const next: Record<number, XqWorkOrderApi.WorkOrder> = {};
  for (const [k, v] of Object.entries(selectedMap.value)) {
    const key = Number(k);
    if (!checked && key === row.id) continue;
    next[key] = v;
  }
  if (checked) next[row.id] = row;
  selectedMap.value = next;
}

function clearSelection() {
  selectedMap.value = {};
}

async function loadGigaCategories() {
  catLoading.value = true;
  try {
    gigaCategoryTree.value = (await getXqCategoryTree()) || [];
  } catch (error: any) {
    message.error(error?.message || '大健云仓类目加载失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadTasks() {
  loading.value = true;
  try {
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      gigaCategoryId: gigaCategoryId.value,
      selectedPool: true,
      status: 10,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch (error: any) {
    message.error(error?.message || '加载已选产品池失败');
  } finally {
    loading.value = false;
  }
}

function onGigaCategoryChange(v: any) {
  gigaCategoryId.value =
    v === null || v === undefined || v === '' ? undefined : Number(v);
  pageNo.value = 1;
  loadTasks();
}

async function loadScope() {
  try {
    const scope = await getXqWorkbenchScope();
    scopePlatforms.value = (scope?.platforms || []).filter((p) => p?.id);
    if (scopePlatforms.value.length > 0) {
      platforms.value = scopePlatforms.value.map((p) => ({
        id: String(p.id),
        name: p.name,
        code: p.code || '',
      }));
      return;
    }
  } catch {
    /* fallback */
  }
  platforms.value = (await getXqListingPlatforms()) || [];
}

async function onPlatformChange(pid?: string) {
  bindForm.listingShopId = undefined;
  bindForm.listingCategoryId = undefined;
  shops.value = [];
  categories.value = [];
  if (!pid) return;
  try {
    const scoped = scopePlatforms.value.find(
      (p) => String(p.id) === String(pid),
    );
    const shopList = scoped?.shops?.length
      ? scoped.shops
      : (await getXqListingShops(pid)) || [];
    const cats = (await getXqListingCategories(pid)) || [];
    shops.value = shopList;
    categories.value = cats;
  } catch (error: any) {
    message.error(error?.message || '加载店铺/类目失败');
  }
}

function openBind() {
  if (!selectedCount.value) {
    message.warning('请先勾选产品');
    return;
  }
  bindForm.listingPlatformId = undefined;
  bindForm.listingShopId = undefined;
  bindForm.listingCategoryId = undefined;
  shops.value = [];
  categories.value = [];
  bindOpen.value = true;
}

async function confirmBind() {
  if (!bindForm.listingPlatformId || !bindForm.listingCategoryId) {
    message.warning('请选择平台和分类');
    return;
  }
  const ids = Object.keys(selectedMap.value).map(Number);
  const plat = platforms.value.find(
    (p) => String(p.id) === String(bindForm.listingPlatformId),
  );
  const shop = shops.value.find(
    (s) => String(s.id) === String(bindForm.listingShopId),
  );
  binding.value = true;
  try {
    const n = await bindXqWorkOrderListing({
      ids,
      listingPlatformId: String(bindForm.listingPlatformId),
      listingPlatformName: plat?.name,
      listingShopId: bindForm.listingShopId
        ? String(bindForm.listingShopId)
        : undefined,
      listingShopName: shop?.name,
      listingCategoryId: String(bindForm.listingCategoryId),
      listingCategoryName: findCatName(
        categories.value,
        bindForm.listingCategoryId,
      ),
      expandFamily: true,
    });
    message.success(`已绑定 ${n} 条任务的平台/分类`);
    bindOpen.value = false;
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '绑定失败');
  } finally {
    binding.value = false;
  }
}

watch([pageNo, pageSize], () => loadTasks());

onMounted(async () => {
  await Promise.all([loadScope(), loadGigaCategories(), loadTasks()]);
});
</script>

<template>
  <Page auto-content-height content-class="xq-selected-pool-page">
    <div class="xq-toolbar">
      <div class="xq-toolbar-title">
        已选产品池
        <span class="xq-toolbar-hint">
          旧数据：已领取、有文案、已跑图，但未选平台/分类 — 由运营补绑
        </span>
      </div>
      <div class="xq-toolbar-actions">
        <TreeSelect
          :value="gigaCategoryId"
          allow-clear
          show-search
          tree-node-filter-prop="title"
          placeholder="大健云仓分类"
          style="width: 240px"
          :loading="catLoading"
          :tree-data="gigaCategoryTreeData"
          :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
          @change="onGigaCategoryChange"
        />
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="搜索 SKU / 标题 / 任务号"
          style="width: 220px"
          @press-enter="
            () => {
              pageNo = 1;
              loadTasks();
            }
          "
        />
        <Button
          type="primary"
          @click="
            () => {
              pageNo = 1;
              loadTasks();
            }
          "
        >
          搜索
        </Button>
        <Button type="primary" :disabled="!selectedCount" @click="openBind">
          选择平台分类{{ selectedCount ? ` (${selectedCount})` : '' }}
        </Button>
        <Button :disabled="!selectedCount" @click="clearSelection">
          清空选择
        </Button>
      </div>
    </div>

    <Spin :spinning="loading">
      <Empty
        v-if="!tasks.length && !loading"
        description="暂无待补绑的旧数据"
      />
      <div v-else class="xq-grid">
        <div
          v-for="row in tasks"
          :key="row.id"
          class="xq-card"
          :class="{ 'is-checked': isChecked(row.id) }"
          @click="toggleSelect(row, !isChecked(row.id))"
        >
          <Checkbox
            class="xq-check"
            :checked="isChecked(row.id)"
            @click.stop
            @change="(e: any) => toggleSelect(row, !!e?.target?.checked)"
          />
          <div class="xq-cover">
            <Image
              v-if="coverOf(row)"
              :src="coverOf(row)"
              :preview="false"
              fit="contain"
            />
            <div v-else class="xq-cover-empty">无图</div>
          </div>
          <div class="xq-body">
            <div class="xq-sku">{{ row.externalSku || row.no }}</div>
            <div class="xq-title" :title="row.title || row.contentTitle">
              {{ row.contentTitle || row.title || '—' }}
            </div>
            <div
              v-if="row.categoryName"
              class="xq-giga-cat"
              :title="row.categoryName"
            >
              {{ row.categoryName }}
            </div>
            <div class="xq-tags">
              <Tag color="blue">有文案</Tag>
              <Tag color="green">{{ row.imageStatus || '已出图' }}</Tag>
              <Tag color="orange">待选平台</Tag>
            </div>
          </div>
        </div>
      </div>
      <div v-if="total > 0" class="xq-pager">
        <Pagination
          v-model:current="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          show-size-changer
          :page-size-options="['12', '20', '40']"
        />
      </div>
    </Spin>

    <Modal
      v-model:open="bindOpen"
      title="补绑平台与分类"
      ok-text="确认绑定"
      :confirm-loading="binding"
      destroy-on-close
      centered
      width="480px"
      @ok="confirmBind"
    >
      <p class="xq-bind-hint">
        已选
        {{ selectedCount }}
        个产品（含变体将同步）。绑定后可进入对应平台工作台继续上架。
      </p>
      <div class="xq-bind-form">
        <div class="xq-field">
          <label>上架平台</label>
          <Select
            v-model:value="bindForm.listingPlatformId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="选择平台"
            :options="platformOptions"
            @change="(v: any) => onPlatformChange(v)"
          />
        </div>
        <div class="xq-field">
          <label>上架店铺（可选）</label>
          <Select
            v-model:value="bindForm.listingShopId"
            allow-clear
            show-search
            option-filter-prop="label"
            :placeholder="
              bindForm.listingPlatformId ? '选择店铺' : '请先选平台'
            "
            :options="shopOptions"
            :disabled="!bindForm.listingPlatformId"
          />
        </div>
        <div class="xq-field">
          <label>上架分类</label>
          <TreeSelect
            v-model:value="bindForm.listingCategoryId"
            allow-clear
            show-search
            tree-default-expand-all
            tree-node-filter-prop="title"
            placeholder="选择类目"
            :tree-data="categoryTreeData"
            :disabled="!bindForm.listingPlatformId"
            :dropdown-style="{ maxHeight: '280px', overflow: 'auto' }"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-selected-pool-page {
  padding: 12px 16px 24px;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.xq-toolbar-title {
  font-size: 16px;
  font-weight: 600;
}

.xq-toolbar-hint {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  color: #8c8c8c;
}

.xq-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.xq-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.xq-card:hover,
.xq-card.is-checked {
  border-color: #1677ff;
  box-shadow: 0 0 0 1px #1677ff22;
}

.xq-check {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.xq-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  background: #fafafa;
}

.xq-cover :deep(img) {
  max-width: 100%;
  max-height: 160px;
  object-fit: contain;
}

.xq-cover-empty {
  color: #bfbfbf;
}

.xq-body {
  padding: 8px 10px 12px;
}

.xq-sku {
  font-size: 12px;
  font-weight: 600;
  color: #262626;
}

.xq-title {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #595959;
  white-space: nowrap;
}

.xq-giga-cat {
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
}

.xq-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.xq-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.xq-bind-hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: #8c8c8c;
}

.xq-bind-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xq-field label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #595959;
}
</style>
