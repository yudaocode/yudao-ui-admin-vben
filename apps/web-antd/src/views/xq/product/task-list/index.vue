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

import {
  getXqListingCategories,
  getXqListingPlatforms,
} from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  closeXqWorkOrder,
  confirmXqWorkOrderListing,
  enqueueXqWorkOrderCopyRpa,
  exportXqWorkOrderListing,
  getXqAssignableImageUsers,
  getXqWorkOrderPage,
  listXqWorkOrder,
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
/** undefined=全部 / true=已选 / false=未选 */
const filterCategorySelected = ref<boolean | undefined>();
const listingCategoryTree = ref<XqListingApi.CategoryNode[]>([]);
const platforms = ref<XqListingApi.Platform[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const executingId = ref<null | number>(null);
const listingBusyId = ref<null | number>(null);
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

/** 过滤 Giga JSON null 被读成字面量 "null" 的脏值 */
function cleanText(v?: null | number | string) {
  const s = String(v ?? '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  return s;
}

function skuLabel(row: XqWorkOrderApi.WorkOrder) {
  return (
    cleanText(row.itemCode) ||
    cleanText(row.externalSku) ||
    cleanText(row.title) ||
    (row.id === null || row.id === undefined ? '—' : String(row.id))
  );
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

function platformListingMode(row: XqWorkOrderApi.WorkOrder): 'api' | 'export' {
  const pid = String(row.listingPlatformId || lockedPlatformId.value || '');
  const hit = platforms.value.find((p) => String(p.id) === pid);
  return hit?.listingMode === 'api' ? 'api' : 'export';
}

function parseListingValues(row: XqWorkOrderApi.WorkOrder) {
  try {
    const obj = row.listingValuesJson ? JSON.parse(row.listingValuesJson) : {};
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k) out[k] = v === null || v === undefined ? '' : String(v);
    }
    return out;
  } catch {
    return {};
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function actionText(row: XqWorkOrderApi.WorkOrder) {
  const step = flowStep(row);
  if (step === '已上架') return '查看';
  if (step === '审核中') return '确认图文';
  if (step === '待分配美工' || step === '待执行图片') return '审核';
  if (step === '已关闭') return '查看';
  if (step === '待上架') {
    if (row.listingStatus === 'export_pending_confirm') return '确认已上架';
    return platformListingMode(row) === 'api' ? 'API上架' : '导表上架';
  }
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
      listingCategorySelected: filterCategorySelected.value,
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

async function submitListingFromList(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id || listingBusyId.value === row.id) return;
  if (!row.listingCategoryId) {
    message.warning('请先在文案侧选择上架类目');
    return;
  }
  if (row.listingStatus === 'export_pending_confirm') {
    Modal.confirm({
      title: '确认已完成上架？',
      content: '导表文件已导出过，确认后任务将标记为已上架。',
      okText: '确认已上架',
      async onOk() {
        listingBusyId.value = row.id!;
        try {
          await confirmXqWorkOrderListing(row.id!);
          message.success('已确认上架');
          await loadTasks();
        } catch (error: any) {
          message.error(error?.message || '确认失败');
          throw error;
        } finally {
          listingBusyId.value = null;
        }
      },
    });
    return;
  }
  const mode = platformListingMode(row);
  listingBusyId.value = row.id;
  try {
    const values = parseListingValues(row);
    if (mode === 'export') {
      const blob = await exportXqWorkOrderListing({
        id: row.id,
        productSku: row.externalSku || undefined,
        productName: row.contentTitle || row.title || undefined,
        values,
      });
      downloadBlob(blob, `${row.externalSku || row.id}_listing.xlsx`);
      message.success('导表成功，请确认是否已上架');
    } else {
      await listXqWorkOrder({
        id: row.id,
        listingMode: 'api',
        productSku: row.externalSku || undefined,
        productName: row.contentTitle || row.title || undefined,
        values,
      });
      message.success('API 上架成功');
    }
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '上架失败');
  } finally {
    listingBusyId.value = null;
  }
}

/** 点列表行：始终进入对应编辑/查看页，不跑上架等按钮动作 */
function openTaskEdit(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id) return;
  const parentPath = route.path.replace(/\/[^/]+$/, '');
  const step = flowStep(row);
  // 审核中 / 待上架 / 已上架 → 编辑产品（desk 无 listing 路由，勿再跳 /listing）
  if (step === '审核中' || step === '待上架' || step === '已上架') {
    router.push({
      path: `${parentPath}/copy`,
      query: {
        platformId: lockedPlatformId.value || undefined,
        id: String(row.id),
        ...(step === '审核中' ? { review: '1' } : {}),
      },
    });
    return;
  }
  const pathSuffix =
    step === '图片执行中' || step === '待执行图片' ? 'image' : 'copy';
  router.push({
    path: `${parentPath}/${pathSuffix}`,
    query: {
      platformId: lockedPlatformId.value || undefined,
      id: String(row.id),
    },
  });
}

/** 点右侧主按钮：上架 / 确认图文 / 查看等，与行点击分离 */
function runTaskAction(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id) return;
  const parentPath = route.path.replace(/\/[^/]+$/, '');
  const step = flowStep(row);
  // 待上架：有 API 调接口，无接口导表，不跳转
  if (step === '待上架') {
    void submitListingFromList(row);
    return;
  }
  // 审核中 → 编辑产品页核对图文后再确认
  if (step === '审核中') {
    router.push({
      path: `${parentPath}/copy`,
      query: {
        platformId: lockedPlatformId.value || undefined,
        id: String(row.id),
        review: '1',
      },
    });
    return;
  }
  // 已上架 → 编辑产品查看；图片阶段进图片池；其余进编辑产品
  if (step === '已上架') {
    router.push({
      path: `${parentPath}/copy`,
      query: {
        platformId: lockedPlatformId.value || undefined,
        id: String(row.id),
      },
    });
    return;
  }
  const pathSuffix =
    step === '图片执行中' || step === '待执行图片' ? 'image' : 'copy';
  router.push({
    path: `${parentPath}/${pathSuffix}`,
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
  assignSkuLabel.value = skuLabel(row);
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
        ? `已批量入队 ${totalN} 条并自动触发文案 RPA（含变体）`
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
  try {
    platforms.value = (await getXqListingPlatforms()) || [];
  } catch {
    platforms.value = [];
  }
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
          v-model:value="filterCategorySelected"
          allow-clear
          class="xq-list-cat-selected"
          placeholder="类目是否选择"
          :options="[
            { label: '已选类目', value: true },
            { label: '未选类目', value: false },
          ]"
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
            @click="openTaskEdit(row)"
            @keydown.enter="openTaskEdit(row)"
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
                :width="40"
                :height="40"
              />
            </div>
            <div class="xq-card-sku" :title="skuLabel(row)">
              {{ skuLabel(row) }}
            </div>
            <span class="xq-card-badge">{{ skuCount(row) }}SKU</span>
            <span class="xq-meta" :title="siteOf(row)">
              <i>站点</i>{{ siteOf(row) }}
            </span>
            <span class="xq-meta" :title="categoryOf(row)">
              <i>类目</i>{{ categoryOf(row) }}
            </span>
            <span class="xq-meta" :title="shopOf(row)">
              <i>店铺</i>{{ shopOf(row) }}
            </span>
            <span class="xq-meta" :class="{ on: templateLoaded(row) }">
              <i>模板</i>{{ templateLoaded(row) ? '已加载' : '未加载' }}
            </span>
            <span class="xq-card-status">{{ flowStep(row) }}</span>
            <div class="xq-card-side" @click.stop>
              <button
                v-if="
                  canExecute(row) ||
                  row.rpaCopyStatus === 'running' ||
                  row.rpaCopyStatus === 'queued'
                "
                type="button"
                class="xq-exec"
                :disabled="!canExecute(row) || executingId === row.id"
                @click.stop="executeTask(row)"
              >
                {{ executingId === row.id ? '入队中…' : executeLabel(row) }}
              </button>
              <button
                v-if="canAssignImage(row)"
                type="button"
                class="xq-assign"
                @click.stop="openAssign(row)"
              >
                {{ assignButtonText(row) }}
              </button>
              <button
                type="button"
                class="xq-write"
                :disabled="listingBusyId === row.id"
                @click.stop="runTaskAction(row)"
              >
                {{
                  listingBusyId === row.id
                    ? platformListingMode(row) === 'api'
                      ? '上架中…'
                      : row.listingStatus === 'export_pending_confirm'
                        ? '确认中…'
                        : '导表中…'
                    : actionText(row)
                }}
              </button>
              <button
                v-if="canCancel(row)"
                type="button"
                class="xq-cancel"
                @click.stop="cancelTask(row)"
              >
                取消
              </button>
            </div>
            <div class="xq-card-flow" aria-hidden="true">
              <div class="xq-flow" :style="{ '--flow-n': FLOW_STEPS.length }">
                <div
                  v-for="(step, idx) in FLOW_STEPS"
                  :key="step"
                  class="xq-flow-node"
                  :class="flowTone(row, step)"
                >
                  <span
                    class="xq-flow-seg"
                    :class="[idx === 0 ? 'is-edge' : flowTone(row, step)]"
                  ></span>
                  <i class="xq-flow-dot"></i>
                  <span
                    class="xq-flow-seg"
                    :class="[
                      idx >= FLOW_STEPS.length - 1
                        ? 'is-edge'
                        : flowTone(row, FLOW_STEPS[idx + 1]!),
                    ]"
                  ></span>
                  <em>{{ FLOW_STEP_SHORT[step] }}</em>
                </div>
              </div>
              <span v-if="listSubLabel(row)" class="xq-flow-sub">{{
                listSubLabel(row)
              }}</span>
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

.xq-list-cat-selected {
  width: 140px;
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
  gap: 6px;
}

/* 左密排网格：列宽按内容收紧，末列吃掉空白，状态/操作贴信息 */
.xq-card {
  position: relative;
  display: grid;
  grid-template-columns:
    20px
    40px
    minmax(5.5rem, 7.5rem)
    2.6rem
    minmax(3.5rem, 5rem)
    minmax(3.5rem, 5.5rem)
    minmax(3.5rem, 5rem)
    4.2rem
    5.5rem
    1fr
    auto;
  gap: 0 8px;
  align-items: center;
  min-height: 52px;
  padding: 6px 10px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.xq-card:hover {
  z-index: 3;
  border-color: #bfdbfe;
}

.xq-card.is-checked {
  background: #f8fbff;
  border-color: #93c5fd;
}

.xq-card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  cursor: pointer;
}

.xq-card-thumb {
  width: 40px;
  height: 40px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 6px;
}

.xq-card-thumb :deep(.ant-image) {
  display: block;
  width: 40px !important;
  height: 40px !important;
}

.xq-card-thumb :deep(.ant-image-img),
.xq-card-thumb :deep(img) {
  width: 40px !important;
  height: 40px !important;
  object-fit: cover;
}

.xq-card-sku {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
  color: #111827;
  white-space: nowrap;
}

.xq-card-badge {
  font-size: 11px;
  line-height: 1;
  color: #9ca3af;
  white-space: nowrap;
}

.xq-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: #374151;
  white-space: nowrap;
}

.xq-meta i {
  margin-right: 3px;
  font-style: normal;
  font-weight: 400;
  color: #9ca3af;
}

.xq-meta.on {
  color: #059669;
}

.xq-card-status {
  justify-self: start;
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 600;
  line-height: 22px;
  color: #047857;
  text-align: center;
  white-space: nowrap;
  background: #d1fae5;
  border-radius: 999px;
}

.xq-card-side {
  display: flex;
  flex-wrap: nowrap;
  grid-column: -1;
  gap: 4px;
  align-items: center;
  justify-self: end;
  white-space: nowrap;
}

.xq-card-flow {
  position: absolute;
  top: calc(100% + 2px);
  left: 68px;
  z-index: 4;
  display: none;
  flex-direction: column;
  gap: 4px;
  width: min(420px, calc(100% - 80px));
  padding: 8px 10px 6px;
  pointer-events: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgb(15 23 42 / 10%);
}

.xq-card:hover .xq-card-flow {
  display: flex;
}

.xq-flow {
  display: grid;
  grid-template-columns: repeat(var(--flow-n, 7), minmax(0, 1fr));
}

.xq-flow-node {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-width: 0;
}

.xq-flow-seg {
  height: 2px;
  background: #e5e7eb;
}

.xq-flow-seg.is-edge {
  background: transparent;
}

.xq-flow-dot {
  width: 6px;
  height: 6px;
  background: #d1d5db;
  border-radius: 50%;
}

.xq-flow-node em {
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  font-style: normal;
  line-height: 1.2;
  color: #9ca3af;
  text-align: center;
  white-space: nowrap;
}

.xq-flow-node.done .xq-flow-dot,
.xq-flow-seg.done,
.xq-flow-seg.active {
  background: #6ee7b7;
}

.xq-flow-node.done em {
  color: #6b7280;
}

.xq-flow-node.active .xq-flow-dot {
  width: 8px;
  height: 8px;
  background: #059669;
  box-shadow: 0 0 0 2px rgb(16 185 129 / 16%);
}

.xq-flow-node.active em {
  font-weight: 650;
  color: #047857;
}

.xq-flow-sub {
  font-size: 11px;
  color: #d97706;
}

.xq-exec,
.xq-assign,
.xq-write,
.xq-cancel {
  padding: 0 8px;
  font-size: 12px;
  line-height: 24px;
  cursor: pointer;
  background: #fff;
  border-radius: 6px;
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

@media (max-width: 1200px) {
  .xq-card {
    grid-template-columns:
      20px
      40px
      minmax(5rem, 7rem)
      2.6rem
      minmax(3rem, 4.5rem)
      minmax(3rem, 5rem)
      minmax(3rem, 4.5rem)
      4rem
      5.5rem
      1fr
      auto;
    gap: 0 6px;
  }
}
</style>
