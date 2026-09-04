<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, DescriptionsItem } from 'antdv-next';

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
  <Card title="历史月度工资" :style="{ marginBottom: '15px' }">
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              onClick: () => openDetail(row),
            },
          ]"
        />
      </template>
    </Grid>

    <DetailModal title="工资明细" class="w-[620px]">
      <Descriptions v-if="detail" bordered :column="2" size="small">
        <DescriptionsItem label="计薪月份">
          {{ formatHrmYearMonth(detail.year, detail.month) }}
        </DescriptionsItem>
        <DescriptionsItem label="出勤天数">
          {{ detail.actualWorkDay ?? '-' }} / {{ detail.needWorkDay ?? '-' }} 天
        </DescriptionsItem>
        <DescriptionsItem label="应发工资">
          {{ formatHrmMoney(detail.expectedPaySalary) }}
        </DescriptionsItem>
        <DescriptionsItem label="个人所得税">
          {{ formatHrmMoney(detail.personalTax) }}
        </DescriptionsItem>
        <DescriptionsItem label="实发工资" :span="2">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </DescriptionsItem>
      </Descriptions>
      <OptionGrid v-if="detail?.optionValues?.length" class="mt-4 w-full" />
    </DetailModal>
  </Card>
</template>
