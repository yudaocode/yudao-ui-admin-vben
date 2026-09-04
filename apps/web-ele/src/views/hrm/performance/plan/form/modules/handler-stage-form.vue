<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { nextTick, watch } from 'vue';

import { ElButton, ElOption, ElSelect } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import RaterLevelSelect from '#/views/hrm/performance/components/rater-level-select.vue';
import {
  HrmPerformanceHandlerTypeOptions,
  HrmPerformanceRaterType,
} from '#/views/hrm/utils/constants';

import { useHandlerStageGridColumns } from '../../data';

defineOptions({ name: 'HrmPerformancePlanHandlerStageForm' });

const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});

const model = defineModel<HrmPerformancePlanApi.PerformanceHandlerStage[]>({
  required: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useHandlerStageGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

function createDefaultHandlerStage(): HrmPerformancePlanApi.PerformanceHandlerStage {
  return {
    type: HrmPerformanceRaterType.SUPERIOR,
    level: 1,
  };
}

function addStage() {
  model.value = [...(model.value || []), createDefaultHandlerStage()];
}

function removeStage(index: number) {
  if ((model.value?.length || 0) <= 1) return;
  model.value = model.value.filter((_, stageIndex) => stageIndex !== index);
}

function handleHandlerTypeChange(
  stage: HrmPerformancePlanApi.PerformanceHandlerStage,
) {
  stage.level =
    stage.type === HrmPerformanceRaterType.SUPERIOR ||
    stage.type === HrmPerformanceRaterType.DEPT_LEADER
      ? 1
      : undefined;
  stage.employeeId = undefined;
}

watch(
  model,
  async (rows) => {
    await nextTick();
    await gridApi.grid.reloadData(rows || []);
  },
  { immediate: true },
);
</script>

<template>
  <div class="w-full">
    <Grid class="w-full">
      <template #type="{ row }">
        <ElSelect
          v-model="row.type"
          :disabled="props.disabled"
          class="w-full"
          placeholder="请选择处理人"
          @change="handleHandlerTypeChange(row)"
        >
          <ElOption
            v-for="item in HrmPerformanceHandlerTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </template>
      <template #scope="{ row }">
        <RaterLevelSelect
          v-if="
            row.type === HrmPerformanceRaterType.SUPERIOR ||
            row.type === HrmPerformanceRaterType.DEPT_LEADER
          "
          v-model="row.level"
          :disabled="props.disabled"
          :rater-type="row.type"
        />
        <EmployeeSelect
          v-else
          v-model="row.employeeId"
          :disabled="props.disabled"
          placeholder="请选择处理员工"
        />
      </template>
      <template #actions="{ row }">
        <ElButton
          :disabled="props.disabled || (model?.length || 0) <= 1"
          link
          title="删除处理节点"
          type="danger"
          @click="removeStage(model.indexOf(row))"
        >
          删除
        </ElButton>
      </template>
    </Grid>
    <ElButton
      :disabled="props.disabled || (model?.length || 0) >= 3"
      class="mt-3"
      @click="addStage"
    >
      新增处理节点
    </ElButton>
  </div>
</template>
