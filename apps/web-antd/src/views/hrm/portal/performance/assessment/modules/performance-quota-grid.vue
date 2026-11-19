<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { nextTick, watch } from 'vue';

import { Input, InputNumber, Select, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { HrmPerformanceQuotaScoreType } from '#/views/hrm/utils/constants';
import { isCompletionRateQuota } from '#/views/hrm/utils/performance';

import { useQuotaEditGridColumns } from '../data';

const props = defineProps<{
  allowEdit?: boolean; // 维度是否允许编辑；不允许时目标值沿用考核模板
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
        <Tag>预置</Tag>
      </div>
      <Input
        v-else
        v-model:value="row.name"
        :disabled="props.disabled"
        :maxlength="255"
        placeholder="请输入指标名称"
      />
    </template>
    <template #description="{ row }">
      <span v-if="row.preset">{{ row.description || '-' }}</span>
      <Input
        v-else
        v-model:value="row.description"
        :disabled="props.disabled"
        :maxlength="1000"
        placeholder="请输入指标说明"
      />
    </template>
    <template #standard="{ row }">
      <span v-if="row.preset">{{ row.standard || '-' }}</span>
      <Input
        v-else
        v-model:value="row.standard"
        :disabled="props.disabled"
        :maxlength="1000"
        placeholder="请输入考核标准"
      />
    </template>
    <template #weight="{ row }">
      <span v-if="row.preset">{{ row.weight || 0 }}%</span>
      <InputNumber
        v-else
        v-model:value="row.weight"
        :disabled="props.disabled"
        class="w-full"
        :controls="false"
        :max="100"
        :min="0.01"
        :precision="2"
      />
    </template>
    <template #scoreType="{ row }">
      <span v-if="row.preset">
        {{ isCompletionRateQuota(row.scoreType) ? '完成率' : '直接输入' }}
      </span>
      <Select
        v-else
        v-model:value="row.scoreType"
        :disabled="props.disabled"
        class="w-full"
        :options="[
          {
            label: '直接输入',
            value: HrmPerformanceQuotaScoreType.DIRECT_INPUT,
          },
          {
            label: '完成率',
            value: HrmPerformanceQuotaScoreType.COMPLETION_RATE,
          },
        ]"
      />
    </template>
    <template #targetValue="{ row }">
      <span v-if="!props.allowEdit">{{ row.targetValue || '-' }}</span>
      <Input
        v-else
        v-model:value="row.targetValue"
        :disabled="props.disabled"
        :maxlength="1000"
        :placeholder="
          isCompletionRateQuota(row.scoreType) ? '大于 0 的数字' : '选填'
        "
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        v-if="!row.preset"
        :actions="[
          {
            label: '删除',
            type: 'link',
            danger: true,
            icon: ACTION_ICON.DELETE,
            disabled: props.disabled,
            onClick: () => emit('remove', row),
          },
        ]"
      />
    </template>
  </Grid>
</template>
