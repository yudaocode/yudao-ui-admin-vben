<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';

import { nextTick, watch } from 'vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DictTag } from '#/components/dict-tag';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';

import {
  buildProjectFooterMethod,
  useEditableProjectGridColumns,
  useProjectDetailGridColumns,
} from '../data';

defineOptions({ name: 'HrmInsuranceMonthRecordProjectGrid' });

const props = withDefaults(
  defineProps<{
    mode?: 'detail' | 'edit';
    rows: HrmInsuranceMonthEmployeeRecordApi.Project[];
    schemeType?: number;
  }>(),
  { mode: 'edit', schemeType: undefined },
);

type ProjectRow = HrmInsuranceMonthEmployeeRecordApi.Project;

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: [],
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'schemeProjectId', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<ProjectRow>,
});

watch(
  [() => props.rows, () => props.schemeType, () => props.mode],
  async ([rows, schemeType, mode]) => {
    const showProportion = schemeType === HrmInsuranceSchemeType.PROPORTION;
    gridApi.setGridOptions({
      columns:
        mode === 'detail'
          ? useProjectDetailGridColumns(showProportion)
          : useEditableProjectGridColumns(showProportion),
      footerMethod: buildProjectFooterMethod(),
      showFooter: mode === 'detail',
    });
    await nextTick();
    await gridApi.grid.reloadData(rows);
  },
  { immediate: true },
);
</script>

<template>
  <Grid class="w-full">
    <template #type="{ row }">
      <DictTag type="hrm_insurance_project_type" :value="row.type ?? ''" />
    </template>
    <template #baseAmount="{ row }">
      <ElInputNumber
        v-model="row.baseAmount"
        :controls="false"
        :min="0"
        :precision="2"
        class="w-full"
      />
    </template>
    <template #corporateAmount="{ row }">
      <ElInputNumber
        v-model="row.corporateAmount"
        :controls="false"
        :min="0"
        :precision="2"
        class="w-full"
      />
    </template>
    <template #personalAmount="{ row }">
      <ElInputNumber
        v-model="row.personalAmount"
        :controls="false"
        :min="0"
        :precision="2"
        class="w-full"
      />
    </template>
  </Grid>
</template>
