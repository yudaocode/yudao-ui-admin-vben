<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { nextTick, onMounted, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DictTag } from '#/components/dict-tag';

import { usePayrollReadinessEmployeeGridColumns } from '../data';

defineOptions({ name: 'HrmSalaryPayrollReadinessEmployeeList' });

const props = defineProps<{
  list?: HrmSalaryMonthRecordApi.PayrollReadinessEmployee[];
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: usePayrollReadinessEmployeeGridColumns(),
    data: [],
    maxHeight: 480,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'employeeId', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmSalaryMonthRecordApi.PayrollReadinessEmployee>,
});

async function refreshData() {
  await nextTick();
  await gridApi.grid.reloadData(props.list || []);
}

watch(() => props.list, refreshData, { deep: true });
onMounted(refreshData);
</script>

<template>
  <Grid class="w-full">
    <template #status="{ row }">
      <DictTag
        v-if="row.status !== null"
        :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
        :value="row.status"
      />
      <span v-else>-</span>
    </template>
  </Grid>
</template>
