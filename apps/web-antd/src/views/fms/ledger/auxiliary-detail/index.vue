<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Button, Card, Empty, Input, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAuxiliaryItemSimpleList } from '#/api/fms/config/auxiliary/item';
import {
  exportLedgerAuxiliaryDetail,
  getLedgerAuxiliaryBalanceList,
  getLedgerAuxiliaryDetailList,
} from '#/api/fms/ledger';
import FmsAuxiliaryTypeSelect from '#/views/fms/config/auxiliary/components/auxiliary-type-select.vue';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import FmsLedgerMonthRangePicker from '#/views/fms/ledger/components/ledger-month-range-picker.vue';
import FmsLedgerPrintButton from '#/views/fms/ledger/components/ledger-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { getLedgerRowClassName, useGridColumns } from './data';

defineOptions({ name: 'FmsAuxiliaryDetailLedger' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const types = ref<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>([]); // 辅助核算类别列表
const items = ref<FmsAuxiliaryItemApi.AuxiliaryItemOption[]>([]); // 辅助核算项目列表
const dataItemIds = ref<number[]>([]); // 有发生额的辅助项目编号
const itemKeyword = ref(''); // 辅助项目搜索关键字
const quickPanelCollapsed = ref(false); // 是否收起右侧快捷项目栏
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const monthRange = ref<string[]>([currentMonth, currentMonth]); // 会计期间范围
const queryParams = reactive<FmsLedgerApi.AuxiliaryListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
  auxiliaryTypeId: 0,
  auxiliaryItemId: 0,
});
const selectedType = computed(() =>
  types.value.find((type) => type.id === queryParams.auxiliaryTypeId),
); // 选中的辅助核算类别
const selectedItem = computed(() =>
  items.value.find((item) => item.id === queryParams.auxiliaryItemId),
); // 选中的辅助核算项目
const selectedItemPrintText = computed(() =>
  selectedItem.value
    ? `辅助项目：${selectedType.value?.name} ${selectedItem.value.code}_${selectedItem.value.name}`
    : '',
); // 选中辅助项目的打印文本
const filteredItems = computed(() => {
  const keyword = itemKeyword.value.toLowerCase();
  return items.value
    .filter((item) => dataItemIds.value.includes(item.id))
    .filter(
      (item) =>
        !keyword ||
        `${item.code} ${item.name}`.toLowerCase().includes(keyword),
    );
}); // 过滤后的辅助项目列表
const exportLoading = ref(false); // 导出的加载中

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (
            !accountSetId.value ||
            !queryParams.auxiliaryItemId ||
            monthRange.value.length !== 2
          ) {
            return { list: [], total: 0 };
          }
          Object.assign(queryParams, {
            accountSetId: accountSetId.value,
            startMonth: monthRange.value[0]!,
            endMonth: monthRange.value[1]!,
          });
          const list = await getLedgerAuxiliaryDetailList(queryParams);
          return { list, total: list.length };
        },
      },
    },
    rowClassName: getLedgerRowClassName,
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.Detail>,
});

watch(accountSetId, () => init());

/** 初始化核算项目明细账页面 */
async function init() {
  if (!accountSetId.value) {
    await gridApi.reload();
    return;
  }
  queryParams.accountSetId = accountSetId.value;
  const accountingMonth = await fmsStore.loadCurrentMonth();
  if (accountingMonth) {
    monthRange.value = [accountingMonth, accountingMonth];
    queryParams.startMonth = accountingMonth;
    queryParams.endMonth = accountingMonth;
  }
  if (queryParams.auxiliaryTypeId) {
    await loadItems();
  }
}

/** 处理辅助核算类别列表加载完成 */
function handleTypeLoaded(list: FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]) {
  types.value = list;
  if (!types.value.some((type) => type.id === queryParams.auxiliaryTypeId)) {
    queryParams.auxiliaryTypeId = types.value[0]?.id || 0;
  }
  loadItems();
}

/** 处理辅助类别变化 */
function handleTypeChange(value: number | number[] | undefined) {
  queryParams.auxiliaryTypeId = Array.isArray(value)
    ? value[0] || 0
    : value || 0;
  itemKeyword.value = '';
  loadItems();
}

/** 加载辅助项目并查询有发生额的项目 */
async function loadItems() {
  items.value = [];
  dataItemIds.value = [];
  queryParams.auxiliaryItemId = 0;
  if (!accountSetId.value || !queryParams.auxiliaryTypeId) {
    await gridApi.reload();
    return;
  }
  items.value = await getAuxiliaryItemSimpleList(
    accountSetId.value,
    queryParams.auxiliaryTypeId,
  );
  const balances = await getLedgerAuxiliaryBalanceList({
    accountSetId: accountSetId.value,
    startMonth: monthRange.value[0]!,
    endMonth: monthRange.value[1]!,
    auxiliaryTypeId: queryParams.auxiliaryTypeId,
    subjectId: queryParams.subjectId,
  });
  // 右侧快捷项目只展示查询期间内实际发生过的项目；期初或历史余额不作为本期候选
  dataItemIds.value = balances
    .filter(
      (item) =>
        Number(item.periodDebitAmount || 0) !== 0 ||
        Number(item.periodCreditAmount || 0) !== 0,
    )
    .map((item) => item.auxiliaryItemId);
  queryParams.auxiliaryItemId = dataItemIds.value[0] || 0;
  await gridApi.reload();
}

/** 搜索按钮操作 */
function handleQuery() {
  loadItems();
}

/** 重置按钮操作 */
async function resetQuery() {
  const accountingMonth = await fmsStore.loadCurrentMonth();
  monthRange.value = [
    accountingMonth || currentMonth,
    accountingMonth || currentMonth,
  ];
  queryParams.auxiliaryTypeId = types.value[0]?.id || 0;
  queryParams.subjectId = undefined;
  itemKeyword.value = '';
  await loadItems();
}

/** 处理辅助项目点击 */
function handleItemClick(auxiliaryItemId: number) {
  queryParams.auxiliaryItemId = auxiliaryItemId;
  gridApi.reload();
}

/** 打开凭证详情 */
function openVoucher(row: FmsLedgerApi.Detail) {
  router.push({ path: '/fms/voucher/create', query: { id: row.voucherId } });
}

/** 导出核算项目明细账 */
async function handleExport() {
  if (!queryParams.auxiliaryItemId) return;
  exportLoading.value = true;
  try {
    const data = await exportLedgerAuxiliaryDetail(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '核算项目明细账',
        queryParams.startMonth,
        queryParams.endMonth,
      ),
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  init();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【账簿】账簿管理"
        url="https://doc.iocoder.cn/fms/ledger/"
      />
    </template>
    <div class="flex h-full flex-col">
      <!-- 搜索工作栏 -->
      <Card class="mb-4 shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span>会计期间</span>
            <FmsLedgerMonthRangePicker v-model="monthRange" />
          </div>
          <div class="flex items-center gap-2">
            <span>辅助类</span>
            <FmsAuxiliaryTypeSelect
              :clearable="false"
              :model-value="queryParams.auxiliaryTypeId"
              class="w-60"
              @change="handleTypeChange"
              @loaded="handleTypeLoaded"
            />
          </div>
          <div class="flex items-center gap-2">
            <span>科目</span>
            <FmsSubjectSelect
              v-model="queryParams.subjectId"
              clearable
              placeholder="全部科目"
              class="w-60"
            />
          </div>
          <Button @click="handleQuery">
            <template #icon>
              <IconifyIcon icon="lucide:search" />
            </template>
            搜索
          </Button>
          <Button @click="resetQuery">
            <template #icon>
              <IconifyIcon icon="lucide:refresh-cw" />
            </template>
            重置
          </Button>
          <FmsLedgerPrintButton
            :center-text="selectedItemPrintText"
            :end-month="monthRange[1]!"
            permission-prefix="fms:ledger:detail"
            :start-month="monthRange[0]!"
            target="fms-auxiliary-detail-ledger-table"
            title="核算项目明细账"
          />
          <Button
            v-if="hasAccessByCodes(['fms:ledger:detail:export'])"
            :loading="exportLoading"
            @click="handleExport"
          >
            <template #icon>
              <IconifyIcon icon="lucide:download" />
            </template>
            导出
          </Button>
        </div>
      </Card>

      <!-- 核算项目和明细账列表 -->
      <div class="flex min-h-0 flex-1 flex-col">
        <div v-if="selectedItem" class="mb-3 shrink-0 font-medium">
          {{ selectedType?.name }}：{{ selectedItem.code }}_{{
            selectedItem.name
          }}
        </div>
        <div class="flex min-h-0 flex-1 gap-3">
          <div class="min-w-0 flex-1">
            <Grid id="fms-auxiliary-detail-ledger-table">
              <template #voucherNumber="{ row }">
                <Button
                  v-if="row.voucherId"
                  v-access:code="['fms:voucher:query']"
                  type="link"
                  class="!p-0"
                  @click="openVoucher(row)"
                >
                  {{ row.voucherNumber }}
                </Button>
              </template>
            </Grid>
          </div>
          <!-- 快捷项目 -->
          <div
            v-if="!quickPanelCollapsed"
            class="flex w-60 shrink-0 flex-col border-l border-solid border-border pl-3"
          >
            <div class="mb-2 flex shrink-0 items-center justify-between">
              <span class="font-medium">快捷项目</span>
              <Tooltip title="收起快捷项目">
                <Button
                  shape="circle"
                  size="small"
                  @click="quickPanelCollapsed = true"
                >
                  <template #icon>
                    <IconifyIcon icon="lucide:chevron-right" />
                  </template>
                </Button>
              </Tooltip>
            </div>
            <Input
              v-model:value="itemKeyword"
              allow-clear
              placeholder="搜索辅助项目"
            />
            <div class="mt-3 min-h-0 flex-1 overflow-auto">
              <button
                v-for="item in filteredItems"
                :key="item.id"
                type="button"
                class="hover:bg-primary/10 hover:text-primary flex w-full cursor-pointer flex-col rounded border-0 bg-transparent px-2.5 py-2 text-left"
                :class="{
                  'bg-primary/10 text-primary':
                    item.id === queryParams.auxiliaryItemId,
                }"
                @click="handleItemClick(item.id)"
              >
                <span>{{ item.code }}</span>
                <span>{{ item.name }}</span>
              </button>
              <Empty
                v-if="!filteredItems.length"
                description="暂无辅助项目"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />
            </div>
          </div>
          <div v-else class="w-9 shrink-0 border-l border-solid border-border pl-2">
            <Tooltip title="展开快捷项目">
              <Button
                shape="circle"
                size="small"
                @click="quickPanelCollapsed = false"
              >
                <template #icon>
                  <IconifyIcon icon="lucide:chevron-left" />
                </template>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.fms-ledger-summary-row) {
  font-weight: 600;
  background-color: hsl(var(--muted));
}
</style>
