<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { nextTick, watch } from 'vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import { useQuotaEditGridColumns } from '../data';

const props = defineProps<{
  disabled?: boolean;
  rows: HrmPerformanceAssessmentApi.AssessmentQuota[];
}>();
const emit = defineEmits<{
  remove: [row: HrmPerformanceAssessmentApi.AssessmentQuota];
}>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useQuotaEditGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmPerformanceAssessmentApi.AssessmentQuota>,
});

watch(
  () => props.rows,
  async (rows) => {
    await nextTick();
    await gridApi.grid.reloadData(rows);
  },
  { immediate: true },
);
</script>

<template>
  <Grid class="w-full">
    <template #name="{ row }">
      <div v-if="row.preset" class="flex items-center justify-between gap-2">
        <span>{{ row.name || '-' }}</span>
        <ElTag>预置</ElTag>
      </div>
      <ElInput
        v-else
        v-model="row.name"
        :disabled="props.disabled"
        :maxlength="255"
        placeholder="请输入指标名称"
      />
    </template>
    <template #description="{ row }">
      <span v-if="row.preset">{{ row.description || '-' }}</span>
      <ElInput
        v-else
        v-model="row.description"
        :disabled="props.disabled"
        :maxlength="1000"
        placeholder="请输入指标说明"
      />
    </template>
    <template #standard="{ row }">
      <span v-if="row.preset">{{ row.standard || '-' }}</span>
      <ElInput
        v-else
        v-model="row.standard"
        :disabled="props.disabled"
        :maxlength="1000"
        placeholder="请输入考核标准"
      />
    </template>
    <template #weight="{ row }">
      <span v-if="row.preset">{{ row.weight || 0 }}%</span>
      <ElInputNumber
        v-else
        v-model="row.weight"
        :disabled="props.disabled"
        class="!w-full"
        :controls="false"
        :max="100"
        :min="0.01"
        :precision="2"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        v-if="!row.preset"
        :actions="[
          {
            label: '删除',
            type: 'danger',
            link: true,
            icon: ACTION_ICON.DELETE,
            disabled: props.disabled,
            onClick: () => emit('remove', row),
          },
        ]"
      />
    </template>
  </Grid>
</template>
