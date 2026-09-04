<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { nextTick, watch } from 'vue';

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
      <ElButton :disabled="props.disabled" @click="addQuota">
        新增指标项
      </ElButton>
    </div>
    <Grid class="w-full">
      <template #name="{ row }">
        <ElInput
          v-model="row.name"
          :disabled="props.disabled"
          :maxlength="50"
          placeholder="请输入指标名称"
        />
      </template>
      <template #illustrate="{ row }">
        <ElInput
          v-model="row.illustrate"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 3 }"
          :disabled="props.disabled"
          :maxlength="200"
          placeholder="请输入指标说明"
        />
      </template>
      <template #standard="{ row }">
        <ElInput
          v-model="row.standard"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 3 }"
          :disabled="props.disabled"
          :maxlength="200"
          placeholder="请输入考核标准"
        />
      </template>
      <template #weight="{ row }">
        <div class="flex items-center gap-1">
          <ElInputNumber
            v-model="row.weight"
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
        <ElSelect
          v-model="row.scoreType"
          :disabled="props.disabled"
          class="w-full"
        >
          <ElOption
            label="直接输入"
            :value="HrmPerformanceQuotaScoreType.DIRECT_INPUT"
          />
        </ElSelect>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '删除',
              type: 'danger',
              link: true,
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
