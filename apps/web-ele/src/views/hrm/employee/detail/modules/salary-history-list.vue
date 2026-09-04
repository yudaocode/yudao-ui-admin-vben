<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalaryEmployeeMonthRecordPage } from '#/api/hrm/salary/month-record/employee';
import { HrmSalaryMonthStatus } from '#/views/hrm/utils/constants';
import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

import {
  useSalaryHistoryGridColumns,
  useSalaryOptionValueGridColumns,
} from '../data';

const props = defineProps<{ employeeId: number }>();
const detail = ref<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>();

const [OptionGrid, optionGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSalaryOptionValueGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'code', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions,
});

const [DetailModal, detailModalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) detail.value = undefined;
  },
});

async function openDetail(
  row: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
) {
  detail.value = row;
  detailModalApi.open();
  await nextTick();
  await optionGridApi.grid.reloadData(row.optionValues || []);
}

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useSalaryHistoryGridColumns(),
    minHeight: 260,
    proxyConfig: {
      ajax: {
        query: ({ page }) =>
          getSalaryEmployeeMonthRecordPage({
            employeeId: props.employeeId,
            monthRecordStatus: HrmSalaryMonthStatus.HISTORY,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>,
});
</script>

<template>
  <ElCard
    header="历史月度工资"
    :style="{ marginBottom: '15px' }"
    shadow="never"
  >
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'primary',
              link: true,
              onClick: () => openDetail(row),
            },
          ]"
        />
      </template>
    </Grid>

    <DetailModal title="工资明细" class="w-[620px]">
      <ElDescriptions v-if="detail" border :column="2" size="small">
        <ElDescriptionsItem label="计薪月份">
          {{ formatHrmYearMonth(detail.year, detail.month) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出勤天数">
          {{ detail.actualWorkDay ?? '-' }} / {{ detail.needWorkDay ?? '-' }} 天
        </ElDescriptionsItem>
        <ElDescriptionsItem label="应发工资">
          {{ formatHrmMoney(detail.expectedPaySalary) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="个人所得税">
          {{ formatHrmMoney(detail.personalTax) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实发工资" :span="2">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <OptionGrid v-if="detail?.optionValues?.length" class="mt-4 w-full" />
    </DetailModal>
  </ElCard>
</template>
