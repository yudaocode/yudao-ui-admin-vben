<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';
import type { FlowStep } from '#/views/xq/product/work-order-flow';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

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
  TreeSelect,
} from 'ant-design-vue';

import { getXqListingCategories } from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  closeXqWorkOrder,
  enqueueXqWorkOrderCopyRpa,
  getXqAssignableImageUsers,
  getXqWorkOrderPage,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  canSwitchImageUser,
  FLOW_STATUS_OPTIONS,
  FLOW_STEP_SHORT,
  FLOW_STEPS,
  flowStep,
  flowStepIndex,
  hasCopyReady,
  listSubLabel,
} from '#/views/xq/product/work-order-flow';

defineOptions({ name: 'XqDeskTaskList' });

const router = useRouter();
const route = useRoute();
const lockedPlatformId = useDeskPlatformId();
const userStore = useUserStore();

const loading = ref(false);
const keyword = ref('');
const flowStatus = ref<string | undefined>();
const filterListingCategoryId = ref<string | undefined>();
const listingCategoryTree = ref<XqListingApi.CategoryNode[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const executingId = ref<null | number>(null);
const batchExecuting = ref(false);
const assignOpen = ref(false);
const assigning = ref(false);
const assignTargetIds = ref<number[]>([]);
const assignSkuLabel = ref('');
const imageUserId = ref<number | undefined>();
const users = ref<Array<{ id: number; nickname?: string; username?: string }>>(
  [],
);
/** 任务列表勾选（批量执行文案 / 批量分配美工） */
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});

const myUserId = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  const id = info?.id ?? info?.userId;
  return typeof id === 'number' ? id : Number(id) || undefined;
});

const queryParams = reactive({
  keyword: undefined as string | undefined,
});

const statusTabs = [
  { label: '全部', value: '' },
  ...FLOW_STATUS_OPTIONS,
] as const;

function setFlowStatus(value: string) {
  flowStatus.value = value || undefined;
  handleSearch();
}

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

function actionText(row: XqWorkOrderApi.WorkOrder) {
  const step = flowStep(row);
  if (step === '已上架') return '查看';
  if (step === '待分配美工' || step === '待执行图片') return '审核';
  if (step === '已关闭') return '查看';
  if (step === '待上架') return '去上架';
  return '编辑';
}

function flowTone(row: XqWorkOrderApi.WorkOrder, step: FlowStep) {
  const cur = flowStep(row);
  if (cur === '已关闭') return 'muted';
  const ci = flowStepIndex(cur);
  const si = flowStepIndex(step);
  if (si < 0 || ci < 0) return 'muted';
  if (si < ci) return 'done';
  if (si === ci) return 'active';
  return 'todo';
}

/** 可执行文案 RPA：进行中且未在跑、文案尚未完成（或上次失败可重跑） */
function canExecute(row: XqWorkOrderApi.WorkOrder) {
  if (row.status !== 10 || !row.id) return false;
  if (row.rpaCopyStatus === 'running' || row.rpaCopyStatus === 'queued') {
    return false;
  }
  if (row.contentTitle?.trim() && row.rpaCopyStatus !== 'fail') {
    return false;
  }
  return true;
}

function executeLabel(row: XqWorkOrderApi.WorkOrder) {
  if (row.rpaCopyStatus === 'running' || row.rpaCopyStatus === 'queued') {
    return '执行中';
  }
  if (row.rpaCopyStatus === 'fail') return '重新执行';
  return '执行';
}

/** 家族成员：可售父级含自身+变体；纯分组父级只含变体 */
function familyMembers(row: XqWorkOrderApi.WorkOrder) {
  const kids = row.variants || [];
  if (kids.length === 0) return [row];
  return isSellableParent(row) ? [row, ...kids] : kids;
}

/** 待分配，或已分配但美工未开跑 → 可分配/改派（整家族） */
function canAssignImage(row: XqWorkOrderApi.WorkOrder) {
  return row.status === 10 && Boolean(row.id) && assignIdsOf(row).length > 0;
}

function assignIdsOf(row: XqWorkOrderApi.WorkOrder) {
  const members = familyMembers(row);
  const familyReady = members.some((m) => hasCopyReady(m));
  if (!familyReady) return [];
  return members
    .filter(
      (t) => t.id && canSwitchImageUser(t) && (hasCopyReady(t) || familyReady),
    )
    .map((t) => t.id!);
}

function assignButtonText(row: XqWorkOrderApi.WorkOrder) {
  const members = familyMembers(row);
  return members.some((m) => m.imageUserId) ? '改派美工' : '分配美工';
}

/** 外侧执行：整家族主体+全部变体都入队 */
function executeFamilyIds(row: XqWorkOrderApi.WorkOrder) {
  return familyMembers(row)
    .map((m) => m.id)
    .filter((id): id is number => typeof id === 'number');
}

const selectedRows = computed(() => Object.values(selectedMap.value));
const selectedCount = computed(() => selectedRows.value.length);

function isRowChecked(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.id && selectedMap.value[row.id]);
}

function toggleRowCheck(row: XqWorkOrderApi.WorkOrder, checked?: boolean) {
  if (!row.id) return;
  const on = checked === undefined ? !selectedMap.value[row.id] : checked;
  if (on) {
    selectedMap.value = { ...selectedMap.value, [row.id]: row };
  } else {
    const id = row.id;
    selectedMap.value = Object.fromEntries(
      Object.entries(selectedMap.value).filter(([k]) => Number(k) !== id),
    );
  }
}

function clearRowSelection() {
  selectedMap.value = {};
}

const batchExecutableRows = computed(() =>
  selectedRows.value.filter((r) => canExecute(r)),
);
const batchAssignableRows = computed(() =>
  selectedRows.value.filter((r) => canAssignImage(r)),
);

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
  clearRowSelection();
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

function canCancel(row: XqWorkOrderApi.WorkOrder) {
  return row.status === 10 && typeof row.id === 'number';
}

async function executeTask(row: XqWorkOrderApi.WorkOrder) {
  if (!canExecute(row) || !row.id) return;
  executingId.value = row.id;
  try {
    const n = await enqueueXqWorkOrderCopyRpa({
      rootId: row.id,
      selectedIds: executeFamilyIds(row),
    });
    message.success(
      n > 0 ? `已入队整家族 ${n} 条文案执行（含全部变体）` : '未入队任何任务',
    );
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '执行失败');
  } finally {
    executingId.value = null;
  }
}

async function loadAssignableUsers() {
  users.value = (await getXqAssignableImageUsers()) || [];
  if (myUserId.value && users.value.some((u) => u.id === myUserId.value)) {
    imageUserId.value = myUserId.value;
  } else if (users.value[0]?.id) {
    imageUserId.value = users.value[0].id;
  } else {
    imageUserId.value = undefined;
  }
}

async function openAssign(row: XqWorkOrderApi.WorkOrder) {
  const ids = assignIdsOf(row);
  if (ids.length === 0) {
    message.warning('需文案完成后才能分配美工');
    return;
  }
  assignTargetIds.value = ids;
  assignSkuLabel.value = row.itemCode || row.externalSku || String(row.id);
  assignOpen.value = true;
  try {
    await loadAssignableUsers();
  } catch (error: any) {
    users.value = [];
    message.error(error?.message || '加载美工列表失败');
  }
}

async function openBatchAssign() {
  const rows = batchAssignableRows.value;
  if (rows.length === 0) {
    message.warning('请勾选已完文案、可分配/改派美工的任务');
    return;
  }
  const ids = [...new Set(rows.flatMap((r) => assignIdsOf(r)))];
  if (ids.length === 0) {
    message.warning('勾选项没有可分配的 SKU');
    return;
  }
  assignTargetIds.value = ids;
  assignSkuLabel.value = `${rows.length} 个任务`;
  assignOpen.value = true;
  try {
    await loadAssignableUsers();
  } catch (error: any) {
    users.value = [];
    message.error(error?.message || '加载美工列表失败');
  }
}

async function batchExecuteCopy() {
  const rows = batchExecutableRows.value;
  if (rows.length === 0) {
    message.warning('请勾选可执行文案的任务');
    return;
  }
  batchExecuting.value = true;
  let totalN = 0;
  try {
    for (const row of rows) {
      if (!row.id) continue;
      const n = await enqueueXqWorkOrderCopyRpa({
        rootId: row.id,
        selectedIds: executeFamilyIds(row),
      });
      totalN += n;
    }
    message.success(
      totalN > 0
        ? `已批量入队 ${totalN} 条文案（勾选任务的整家族含变体）`
        : '未入队任何任务',
    );
    clearRowSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '批量执行失败');
  } finally {
    batchExecuting.value = false;
  }
}

async function confirmAssign() {
  if (!imageUserId.value) {
    message.warning('请选择美工人员');
    throw new Error('请选择美工人员');
  }
  if (assignTargetIds.value.length === 0) {
    throw new Error('没有可分配的任务');
  }
  assigning.value = true;
  try {
    const n = await batchAssignXqWorkOrderImage({
      ids: assignTargetIds.value,
      imageUserId: imageUserId.value,
      listingPlatformId: lockedPlatformId.value || undefined,
      expandFamily: true,
    });
    message.success(`已分配 ${n} 个 SKU 给美工（含变体）`);
    assignOpen.value = false;
    clearRowSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '分配失败');
    throw error instanceof Error
      ? error
      : new Error(error?.message || '分配失败');
  } finally {
    assigning.value = false;
  }
}

function cancelTask(row: XqWorkOrderApi.WorkOrder) {
  if (!canCancel(row)) return;
  Modal.confirm({
    title: '取消任务',
    content: `确认取消「${row.itemCode || row.externalSku || row.title || row.id}」？将清空文案、美工分配与生成图，并从「我的文案」移除；取消后可重新下发。`,
    okText: '确认取消',
    okType: 'danger',
    cancelText: '返回',
    async onOk() {
      try {
        await closeXqWorkOrder(row.id!);
        message.success('已取消任务');
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '取消失败');
        throw error;
      }
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
      </div>
      <div class="xq-status-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value || 'all'"
          type="button"
          class="xq-status-tab"
          :class="{
            active: (flowStatus || '') === tab.value,
          }"
          @click="setFlowStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="xq-batch-bar">
        <span class="xq-batch-count">已选 {{ selectedCount }}</span>
        <Button
          type="primary"
          :loading="batchExecuting"
          :disabled="batchExecutableRows.length === 0 || batchExecuting"
          @click="batchExecuteCopy"
        >
          批量执行文案
          <template v-if="batchExecutableRows.length">
            ({{ batchExecutableRows.length }})
          </template>
        </Button>
        <Button
          :disabled="batchAssignableRows.length === 0"
          @click="openBatchAssign"
        >
          批量分配美工
          <template v-if="batchAssignableRows.length">
            ({{ batchAssignableRows.length }})
          </template>
        </Button>
        <Button v-if="selectedCount > 0" type="link" @click="clearRowSelection">
          清空勾选
        </Button>
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-cards">
          <div
            v-for="row in tasks"
            :key="row.id"
            class="xq-card"
            :class="{ 'is-checked': isRowChecked(row) }"
            role="button"
            tabindex="0"
            @click="goEdit(row)"
            @keydown.enter="goEdit(row)"
          >
            <label class="xq-card-check" @click.stop>
              <Checkbox
                :checked="isRowChecked(row)"
                @change="(e: any) => toggleRowCheck(row, !!e?.target?.checked)"
              />
            </label>
            <div class="xq-card-thumb">
              <Image
                :src="coverOf(row)"
                :preview="false"
                :width="72"
                :height="72"
              />
            </div>
            <div class="xq-card-main">
              <div class="xq-card-head">
                <div class="xq-card-sku">
                  {{ row.itemCode || row.externalSku || '—' }}
                </div>
                <span class="xq-card-badge">{{ skuCount(row) }} 个 SKU</span>
                <span class="xq-card-status" :data-step="flowStep(row)">
                  {{ flowStep(row) }}
                </span>
              </div>
              <div class="xq-card-meta">
                <div class="xq-meta-cell">
                  <span>站点</span>
                  <b>{{ siteOf(row) }}</b>
                </div>
                <div class="xq-meta-cell">
                  <span>类目</span>
                  <b>{{ categoryOf(row) }}</b>
                </div>
                <div class="xq-meta-cell">
                  <span>店铺</span>
                  <b>{{ shopOf(row) }}</b>
                </div>
                <div class="xq-meta-cell">
                  <span>模板</span>
                  <b :class="{ on: templateLoaded(row) }">
                    {{ templateLoaded(row) ? '已加载' : '未加载' }}
                  </b>
                </div>
              </div>
              <div class="xq-flow" :title="flowStep(row)">
                <template v-for="(step, idx) in FLOW_STEPS" :key="step">
                  <div
                    v-if="idx > 0"
                    class="xq-flow-line"
                    :class="flowTone(row, step)"
                  ></div>
                  <div class="xq-flow-node" :class="flowTone(row, step)">
                    <i class="xq-flow-dot"></i>
                    <em>{{ FLOW_STEP_SHORT[step] }}</em>
                  </div>
                </template>
              </div>
              <div v-if="listSubLabel(row)" class="xq-flow-sub">
                {{ listSubLabel(row) }}
              </div>
            </div>
            <div class="xq-card-side" @click.stop>
              <div class="xq-card-actions">
                <button
                  v-if="
                    canExecute(row) ||
                    row.rpaCopyStatus === 'running' ||
                    row.rpaCopyStatus === 'queued'
                  "
                  type="button"
                  class="xq-exec"
                  :disabled="!canExecute(row) || executingId === row.id"
                  @click="executeTask(row)"
                >
                  {{ executingId === row.id ? '入队中…' : executeLabel(row) }}
                </button>
                <button
                  v-if="canAssignImage(row)"
                  type="button"
                  class="xq-assign"
                  @click="openAssign(row)"
                >
                  {{ assignButtonText(row) }}
                </button>
                <button type="button" class="xq-write" @click="goEdit(row)">
                  {{ actionText(row) }}
                </button>
                <button
                  v-if="canCancel(row)"
                  type="button"
                  class="xq-cancel"
                  @click="cancelTask(row)"
                >
                  取消任务
                </button>
              </div>
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

    <Modal
      v-model:open="assignOpen"
      title="分配美工"
      ok-text="确认分配"
      :confirm-loading="assigning"
      destroy-on-close
      @ok="confirmAssign"
    >
      <p class="xq-assign-tip">
        将「{{ assignSkuLabel }}」整家族共 {{ assignTargetIds.length }} 个
        SKU（含变体）分配/改派给美工；美工未开跑前可随时切换。
      </p>
      <div class="xq-assign-form">
        <label>美工人员</label>
        <div class="xq-assign-user-row">
          <Select
            v-model:value="imageUserId"
            show-search
            option-filter-prop="label"
            placeholder="选择美工（可搜姓名）"
            style="flex: 1"
            :options="
              users.map((u) => ({
                label: `${u.nickname || u.username || '用户'} (#${u.id})`,
                value: u.id,
              }))
            "
          />
          <Button :disabled="!myUserId" @click="imageUserId = myUserId">
            分配给我
          </Button>
        </div>
      </div>
    </Modal>
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
  margin-bottom: 10px;
}

.xq-list-search {
  flex: 1;
  max-width: 420px;
}

.xq-list-cat {
  width: 240px;
}

.xq-status-tabs {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  max-width: 100%;
  padding-bottom: 2px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.xq-status-tab {
  flex: 0 0 auto;
  padding: 5px 12px;
  font-size: 13px;
  line-height: 1.3;
  color: #4b5563;
  white-space: nowrap;
  cursor: pointer;
  background: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 999px;
}

.xq-status-tab:hover {
  color: #111827;
  background: #e5e7eb;
}

.xq-status-tab.active {
  color: #fff;
  background: #1677ff;
  border-color: #1677ff;
}

.xq-batch-bar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.xq-batch-count {
  min-width: 64px;
  font-size: 13px;
  color: #6b7280;
}

.xq-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xq-card {
  display: flex;
  gap: 14px;
  align-items: stretch;
  padding: 14px 16px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.xq-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 10px rgb(15 23 42 / 4%);
}

.xq-card.is-checked {
  background: #f8fbff;
  border-color: #93c5fd;
}

.xq-card-check {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: center;
  margin: 0;
  cursor: pointer;
}

.xq-card-thumb {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 10px;
}

.xq-card-thumb :deep(.ant-image) {
  display: block;
  width: 72px !important;
  height: 72px !important;
}

.xq-card-thumb :deep(.ant-image-img),
.xq-card-thumb :deep(img) {
  width: 72px !important;
  height: 72px !important;
  object-fit: cover;
}

.xq-card-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.xq-card-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-card-sku {
  font-size: 15px;
  font-weight: 650;
  line-height: 1.2;
  color: #111827;
}

.xq-card-badge {
  padding: 1px 8px;
  font-size: 12px;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 999px;
}

.xq-card-status {
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #047857;
  background: #d1fae5;
  border-radius: 999px;
}

.xq-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.xq-meta-cell {
  display: flex;
  gap: 6px;
  align-items: baseline;
  min-width: 0;
  font-size: 13px;
  line-height: 1.4;
}

.xq-meta-cell span {
  color: #9ca3af;
  white-space: nowrap;
}

.xq-meta-cell b {
  font-weight: 600;
  color: #1f2937;
}

.xq-meta-cell b.on {
  color: #059669;
}

.xq-card-side {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  justify-content: center;
}

.xq-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.xq-flow {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  align-items: flex-start;
  width: 100%;
  max-width: 640px;
  padding-bottom: 2px;
  overflow-x: auto;
}

.xq-flow-node {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  min-width: 64px;
}

.xq-flow-dot {
  width: 8px;
  height: 8px;
  background: #d1d5db;
  border-radius: 50%;
}

.xq-flow-node em {
  font-size: 11px;
  font-style: normal;
  line-height: 1.2;
  color: #9ca3af;
  text-align: center;
  white-space: nowrap;
}

.xq-flow-line {
  flex: 1 1 12px;
  min-width: 10px;
  max-width: 28px;
  height: 2px;
  margin-top: 3px;
  background: #e5e7eb;
}

.xq-flow-node.done .xq-flow-dot,
.xq-flow-line.done,
.xq-flow-line.active {
  background: #6ee7b7;
}

.xq-flow-node.done em {
  color: #6b7280;
}

.xq-flow-node.active .xq-flow-dot {
  width: 10px;
  height: 10px;
  background: #059669;
  box-shadow: 0 0 0 3px rgb(16 185 129 / 18%);
}

.xq-flow-node.active em {
  font-weight: 650;
  color: #047857;
}

.xq-flow-sub {
  font-size: 12px;
  color: #d97706;
}

.xq-exec,
.xq-assign,
.xq-write,
.xq-cancel {
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  background: #fff;
  border-radius: 999px;
}

.xq-exec {
  color: #1677ff;
  border: 1px solid #91caff;
}

.xq-exec:hover:not(:disabled) {
  background: #e6f4ff;
}

.xq-exec:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.xq-assign {
  color: #7c3aed;
  border: 1px solid #c4b5fd;
}

.xq-assign:hover {
  background: #f5f3ff;
}

.xq-write {
  color: #059669;
  border: 1px solid #6ee7b7;
}

.xq-write:hover {
  background: #ecfdf5;
}

.xq-cancel {
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.xq-cancel:hover {
  background: #fef2f2;
}

.xq-assign-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.xq-assign-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xq-assign-form label {
  font-size: 13px;
  color: #374151;
}

.xq-assign-user-row {
  display: flex;
  gap: 8px;
  align-items: center;
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

  .xq-flow {
    max-width: 100%;
  }
}
</style>
