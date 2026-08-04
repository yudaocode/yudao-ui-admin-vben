<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import {
  ElButton,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import RaterLevelSelect from '#/views/hrm/performance/components/rater-level-select.vue';
import {
  HrmPerformanceHandlerTypeOptions,
  HrmPerformanceRaterType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPerformancePlanHandlerStageForm' });

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false });

const model = defineModel<HrmPerformancePlanApi.PerformanceHandlerStage[]>({
  required: true,
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
</script>

<template>
  <div class="w-full">
    <ElTable :data="model" border>
      <ElTableColumn label="处理人" min-width="150">
        <template #default="{ row }">
          <ElSelect
            v-model="row.type"
            :disabled="disabled"
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
      </ElTableColumn>
      <ElTableColumn label="处理人范围" min-width="220">
        <template #default="{ row }">
          <RaterLevelSelect
            v-if="
              row.type === HrmPerformanceRaterType.SUPERIOR ||
              row.type === HrmPerformanceRaterType.DEPT_LEADER
            "
            v-model="row.level"
            :disabled="disabled"
            :rater-type="row.type"
          />
          <EmployeeSelect
            v-else
            v-model="row.employeeId"
            :disabled="disabled"
            placeholder="请选择处理员工"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="72">
        <template #default="{ $index }">
          <ElButton
            :disabled="disabled || (model?.length || 0) <= 1"
            link
            title="删除处理节点"
            type="danger"
            @click="removeStage($index)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ElButton
      :disabled="disabled || (model?.length || 0) >= 3"
      class="mt-3"
      @click="addStage"
    >
      新增处理节点
    </ElButton>
  </div>
</template>
