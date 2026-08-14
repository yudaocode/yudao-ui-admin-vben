<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Button, Card } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportLedgerAuxiliaryBalance,
  getLedgerAuxiliaryBalanceList,
} from '#/api/fms/ledger';
import FmsAuxiliaryItemSelect from '#/views/fms/config/auxiliary/components/auxiliary-item-select.vue';
import FmsAuxiliaryTypeSelect from '#/views/fms/config/auxiliary/components/auxiliary-type-select.vue';
import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import FmsLedgerMonthRangePicker from '#/views/fms/ledger/components/ledger-month-range-picker.vue';
import FmsLedgerPrintButton from '#/views/fms/ledger/components/ledger-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { useGridColumns } from './data';

defineOptions({ name: 'FmsAuxiliaryBalance' });

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const types = ref<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>([]); // 辅助核算类别列表
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const monthRange = ref<string[]>([currentMonth, currentMonth]); // 会计期间范围
const queryParams = reactive<FmsLedgerApi.AuxiliaryListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
  auxiliaryTypeId: 0,
});
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
            !queryParams.auxiliaryTypeId ||
            monthRange.value.length !== 2
          ) {
            return { list: [], total: 0 };
          }
          Object.assign(queryParams, {
            accountSetId: accountSetId.value,
            startMonth: monthRange.value[0]!,
            endMonth: monthRange.value[1]!,
          });
          const list = await getLedgerAuxiliaryBalanceList(queryParams);
          return { list, total: list.length };
        },
      },
    },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.AuxiliaryBalance>,
});

watch(accountSetId, () => init());

/** 初始化核算项目余额表页面 */
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
    await gridApi.reload();
  }
}

/** 处理辅助核算类别列表加载完成 */
function handleTypeLoaded(list: FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]) {
  types.value = list;
  if (!types.value.some((type) => type.id === queryParams.auxiliaryTypeId)) {
    queryParams.auxiliaryTypeId = types.value[0]?.id || 0;
    queryParams.auxiliaryItemId = undefined;
  }
  gridApi.reload();
}

/** 处理辅助类别变化 */
function handleTypeChange(value: number | number[] | undefined) {
  queryParams.auxiliaryTypeId = Array.isArray(value)
    ? value[0] || 0
    : value || 0;
  queryParams.auxiliaryItemId = undefined;
  gridApi.reload();
}

/** 处理辅助项目变化 */
function handleItemChange(value: number | number[] | undefined) {
  queryParams.auxiliaryItemId = Array.isArray(value) ? undefined : value;
}

/** 搜索按钮操作 */
function handleQuery() {
  gridApi.reload();
}

/** 重置按钮操作 */
async function resetQuery() {
  const accountingMonth = await fmsStore.loadCurrentMonth();
  monthRange.value = [
    accountingMonth || currentMonth,
    accountingMonth || currentMonth,
  ];
  queryParams.auxiliaryTypeId = types.value[0]?.id || 0;
  queryParams.auxiliaryItemId = undefined;
  queryParams.subjectId = undefined;
  await gridApi.reload();
}

/** 导出核算项目余额表 */
async function handleExport() {
  if (!queryParams.auxiliaryTypeId) return;
  exportLoading.value = true;
  try {
    const data = await exportLedgerAuxiliaryBalance(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '核算项目余额表',
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
            <span>辅助项目</span>
            <FmsAuxiliaryItemSelect
              :auxiliary-type-id="queryParams.auxiliaryTypeId"
              clearable
              :model-value="queryParams.auxiliaryItemId"
              placeholder="全部辅助项目"
              class="w-60"
              @update:model-value="handleItemChange"
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
            :end-month="monthRange[1]!"
            permission-prefix="fms:ledger:subject-balance"
            :start-month="monthRange[0]!"
            target="fms-auxiliary-balance-table"
            title="核算项目余额表"
          />
          <Button
            v-if="hasAccessByCodes(['fms:ledger:subject-balance:export'])"
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

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-auxiliary-balance-table" />
      </div>
    </div>
  </Page>
</template>
