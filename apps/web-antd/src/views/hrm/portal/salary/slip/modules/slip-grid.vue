<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { buildSalarySlipRow, useSalarySlipGridColumns } from '../data';

const props = defineProps<{
  slip: HrmPortalSalarySlipApi.PortalSalarySlip;
}>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useSalarySlipGridColumns(props.slip),
    data: [buildSalarySlipRow(props.slip)],
    minHeight: 120,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'monthTitle', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Grid class="w-full">
    <template #optionHeader="{ column }">
      <Tooltip :title="column.params?.remark">
        <span class="cursor-help">{{ column.title }}</span>
      </Tooltip>
    </template>
  </Grid>
</template>
