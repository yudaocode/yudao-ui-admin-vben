<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Empty,
  Image,
  Input,
  Pagination,
  Select,
  Spin,
  TreeSelect,
} from 'ant-design-vue';

import { getXqListingCategories } from '#/api/xq/listing';
import { getXqWorkOrderPage } from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

defineOptions({ name: 'XqDeskTaskList' });

const FLOW_STEPS = ['待分配', '写作中', '待审核', '已提交', '已关闭'] as const;

const router = useRouter();
const route = useRoute();
const lockedPlatformId = useDeskPlatformId();

const loading = ref(false);
const keyword = ref('');
const flowStatus = ref<string | undefined>();
const filterListingCategoryId = ref<string | undefined>();
const listingCategoryTree = ref<XqListingApi.CategoryNode[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const queryParams = reactive({
  keyword: undefined as string | undefined,
});

const statusOptions = [
  { label: '待分配', value: 'assign' },
  { label: '写作中', value: 'writing' },
  { label: '待审核', value: 'review' },
  { label: '已提交', value: 'submitted' },
  { label: '已关闭', value: 'closed' },
];

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

const listingCategoryTreeData = computed(() =>
  mapListingCategoryTree(listingCategoryTree.value),
);

function isSellableParent(row: XqWorkOrderApi.WorkOrder) {
  const kids = row.variants || [];
  if (kids.length === 0) return true;
  const parentOffer = Boolean(
    row.mainColor ||
    row.variantLabel ||
    (row.price !== null && row.price !== undefined) ||
    (row.qtyAvailable !== null && row.qtyAvailable !== undefined),
  );
  const childOffer = kids.some((k) =>
    Boolean(
      k.mainColor ||
      k.variantLabel ||
      (k.price !== null && k.price !== undefined) ||
      (k.qtyAvailable !== null && k.qtyAvailable !== undefined),
    ),
  );
  if (childOffer && !parentOffer) return false;
  return true;
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.generatedImageUrl || row.coverUrl || undefined;
}

function skuCount(row: XqWorkOrderApi.WorkOrder) {
  const kids = row.variants?.length || 0;
  if (!kids) return 1;
  return isSellableParent(row) ? kids + 1 : kids;
}

function siteOf(row: XqWorkOrderApi.WorkOrder) {
  const plat = row.listingPlatformName || '';
  const country = row.listingCountryCode || row.listingCountryName || '';
  return [plat, country].filter(Boolean).join(' ') || '—';
}

function categoryOf(row: XqWorkOrderApi.WorkOrder) {
  return row.listingCategoryName || row.categoryName || '—';
}

function shopOf(row: XqWorkOrderApi.WorkOrder) {
  return row.listingShopName || '—';
}

function templateLoaded(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.listingCategoryId);
}

function flowStep(row: XqWorkOrderApi.WorkOrder) {
  if (row.status === 20) return '已提交';
  if (row.status === 30) return '已关闭';
  if (row.status !== 10) return '已关闭';
  if (row.rpaCopyStatus === 'running' || row.rpaCopyStatus === 'queued') {
    return '写作中';
  }
  if (row.contentTitle?.trim()) return '待审核';
  if (!row.copyUserId && !row.contentTitle?.trim()) return '待分配';
  return '写作中';
}

function actionText(row: XqWorkOrderApi.WorkOrder) {
  const step = flowStep(row);
  if (step === '已提交') return '查看';
  if (step === '待审核') return '审核';
  if (step === '待分配') return '写作中';
  return '写作中';
}

async function loadTasks() {
  loading.value = true;
  try {
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: queryParams.keyword,
      flowStatus: flowStatus.value,
      status: flowStatus.value ? undefined : 10,
      listingPlatformId: lockedPlatformId.value || undefined,
      listingCategoryId: filterListingCategoryId.value,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch {
    tasks.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.keyword = keyword.value.trim() || undefined;
  pageNo.value = 1;
  loadTasks();
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadTasks();
}

function goEdit(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id) return;
  const parentPath = route.path.replace(/\/[^/]+$/, '');
  router.push({
    path: `${parentPath}/copy`,
    query: {
      platformId: lockedPlatformId.value || undefined,
      id: String(row.id),
    },
  });
}

const emptyDesc = computed(() =>
  lockedPlatformId.value ? '暂无任务，请先从选品库下发' : '请从平台工作台进入',
);

onMounted(async () => {
  if (lockedPlatformId.value) {
    try {
      listingCategoryTree.value =
        (await getXqListingCategories(lockedPlatformId.value)) || [];
    } catch {
      listingCategoryTree.value = [];
    }
  }
  await loadTasks();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-list-page">
      <div class="xq-list-bar">
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-list-search"
          placeholder="搜索任务号 / SKU / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
        <TreeSelect
          v-model:value="filterListingCategoryId"
          allow-clear
          show-search
          tree-default-expand-all
          tree-node-filter-prop="title"
          class="xq-list-cat"
          placeholder="类目"
          :tree-data="listingCategoryTreeData"
          :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
          @change="handleSearch"
        />
        <Select
          v-model:value="flowStatus"
          allow-clear
          class="xq-list-status"
          placeholder="状态"
          :options="statusOptions"
          @change="handleSearch"
        />
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-cards">
          <div
            v-for="row in tasks"
            :key="row.id"
            class="xq-card"
            role="button"
            tabindex="0"
            @click="goEdit(row)"
            @keydown.enter="goEdit(row)"
          >
            <div class="xq-card-thumb">
              <Image
                :src="coverOf(row)"
                :preview="false"
                :width="56"
                :height="56"
              />
            </div>
            <div class="xq-card-main">
              <div class="xq-card-meta">
                <span>Item Code</span>
                <b>{{ row.itemCode || row.externalSku || '—' }}</b>
                <span>站点</span>
                <b>{{ siteOf(row) }}</b>
                <span>类目</span>
                <b>{{ categoryOf(row) }}</b>
                <span>变体</span>
                <b>{{ skuCount(row) }} 个 SKU</b>
                <span>店铺</span>
                <b>{{ shopOf(row) }}</b>
              </div>
              <div class="xq-card-tpl">
                类目模板：{{ categoryOf(row) }}
                <em :class="{ on: templateLoaded(row) }">
                  {{ templateLoaded(row) ? '已加载' : '未加载' }}
                </em>
              </div>
            </div>
            <div class="xq-card-side" @click.stop>
              <div class="xq-flow">
                <span
                  v-for="step in FLOW_STEPS"
                  :key="step"
                  class="xq-flow-pill"
                  :class="{ active: flowStep(row) === step }"
                >
                  {{ step }}
                </span>
              </div>
              <button type="button" class="xq-write" @click="goEdit(row)">
                {{ actionText(row) }}
              </button>
            </div>
          </div>
        </div>
        <Empty v-else :description="emptyDesc" />
        <div v-if="total > 0" class="xq-list-pager">
          <Pagination
            :current="pageNo"
            :page-size="pageSize"
            :total="total"
            show-size-changer
            :page-size-options="['10', '20', '50']"
            @change="onPageChange"
          />
        </div>
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.xq-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px 16px 16px;
}

.xq-list-bar {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  margin-bottom: 12px;
}

.xq-list-search {
  flex: 1;
  max-width: 420px;
}

.xq-list-cat {
  width: 240px;
}

.xq-list-status {
  width: 140px;
}

.xq-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xq-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
}

.xq-card:hover {
  border-color: #d9d9d9;
}

.xq-card-thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  overflow: hidden;
  background: repeating-linear-gradient(
    -45deg,
    #f3f4f6,
    #f3f4f6 6px,
    #e5e7eb 6px,
    #e5e7eb 12px
  );
  border-radius: 6px;
}

.xq-card-thumb :deep(.ant-image) {
  display: block;
  width: 56px !important;
  height: 56px !important;
}

.xq-card-thumb :deep(.ant-image-img),
.xq-card-thumb :deep(img) {
  width: 56px !important;
  height: 56px !important;
  object-fit: cover;
}

.xq-card-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.xq-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: baseline;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}

.xq-card-meta b {
  margin-right: 8px;
  font-weight: 600;
  color: #111827;
}

.xq-card-tpl {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  align-self: flex-start;
  padding: 2px 8px;
  font-size: 12px;
  color: #059669;
  background: #ecfdf5;
  border-radius: 4px;
}

.xq-card-tpl em {
  font-style: normal;
  color: #9ca3af;
}

.xq-card-tpl em.on {
  color: #059669;
}

.xq-card-side {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
}

.xq-flow {
  display: flex;
  gap: 6px;
  align-items: center;
}

.xq-flow-pill {
  padding: 2px 8px;
  font-size: 12px;
  color: #9ca3af;
  background: #f3f4f6;
  border-radius: 999px;
}

.xq-flow-pill.active {
  color: #059669;
  background: #d1fae5;
}

.xq-write {
  padding: 4px 12px;
  font-size: 13px;
  color: #059669;
  cursor: pointer;
  background: #fff;
  border: 1px solid #6ee7b7;
  border-radius: 999px;
}

.xq-write:hover {
  background: #ecfdf5;
}

.xq-list-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 1100px) {
  .xq-card {
    flex-wrap: wrap;
  }

  .xq-card-side {
    justify-content: flex-end;
    width: 100%;
  }
}
</style>
