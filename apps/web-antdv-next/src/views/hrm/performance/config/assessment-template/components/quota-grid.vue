<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { nextTick, watch } from 'vue';

import { Button, Input, InputNumber, Select } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { HrmPerformanceQuotaScoreType } from '#/views/hrm/utils/constants';

import { useQuotaGridColumns } from '../data';

defineOptions({ name: 'HrmPerformanceAssessmentQuotaGrid' });
const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});
const modelValue = defineModel<
  HrmPerformanceAssessmentTemplateApi.AssessmentQuota[]
>({ default: () => [] });
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useQuotaGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmPerformanceAssessmentTemplateApi.AssessmentQuota>,
});
watch(
  modelValue,
  async (quotas) => {
    await nextTick();
    await gridApi.grid.reloadData(quotas);
  },
  { immediate: true },
);
function addQuota() {
  modelValue.value = [
    ...modelValue.value,
    {
      name: '',
      illustrate: '',
      standard: '',
      weight: undefined,
      scoreType: HrmPerformanceQuotaScoreType.DIRECT_INPUT,
    },
  ];
}
function removeQuota(row: HrmPerformanceAssessmentTemplateApi.AssessmentQuota) {
  modelValue.value = modelValue.value.filter((item) => item !== row);
}
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex justify-end">
      <Button :disabled="props.disabled" @click="addQuota">新增指标项</Button>
    </div>
    <Grid class="w-full">
      <template #name="{ row }">
        <Input
          v-model:value="row.name"
          :disabled="props.disabled"
          :maxlength="50"
          placeholder="请输入指标名称"
        />
      </template>
      <template #illustrate="{ row }">
        <Input.TextArea
          v-model:value="row.illustrate"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          :disabled="props.disabled"
          :maxlength="200"
          placeholder="请输入指标说明"
        />
      </template>
      <template #standard="{ row }">
        <Input.TextArea
          v-model:value="row.standard"
          :auto-size="{ minRows: 1, maxRows: 3 }"
          :disabled="props.disabled"
          :maxlength="200"
          placeholder="请输入考核标准"
        />
      </template>
      <template #weight="{ row }">
        <div class="flex items-center gap-1">
          <InputNumber
            v-model:value="row.weight"
            :controls="false"
            :disabled="props.disabled"
            :max="100"
            :min="0"
            :precision="2"
            class="w-full"
          /><span class="text-gray-500">%</span>
        </div>
      </template>
      <template #scoreType="{ row }">
        <Select
          v-model:value="row.scoreType"
          :disabled="props.disabled"
          class="w-full"
          :options="[
            {
              label: '直接输入',
              value: HrmPerformanceQuotaScoreType.DIRECT_INPUT,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: props.disabled,
              onClick: () => removeQuota(row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
