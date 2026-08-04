<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { Button, Select, Table } from 'antdv-next';

import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import RaterLevelSelect from '#/views/hrm/performance/components/rater-level-select.vue';
import {
  HrmPerformanceHandlerTypeOptions,
  HrmPerformanceRaterType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPerformancePlanHandlerStageForm' });

const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});

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

const columns = [
  { title: '处理人', key: 'type', width: 160 },
  { title: '处理人范围', key: 'scope', minWidth: 220 },
  { title: '操作', key: 'action', width: 72, align: 'center' as const },
];
</script>

<template>
  <div class="w-full">
    <Table
      :columns="columns"
      :data-source="model"
      :pagination="false"
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'type'">
          <Select
            v-model:value="record.type"
            :disabled="disabled"
            :options="[...HrmPerformanceHandlerTypeOptions]"
            class="w-full"
            placeholder="请选择处理人"
            @change="handleHandlerTypeChange(record)"
          />
        </template>
        <template v-else-if="column.key === 'scope'">
          <RaterLevelSelect
            v-if="
              record.type === HrmPerformanceRaterType.SUPERIOR ||
              record.type === HrmPerformanceRaterType.DEPT_LEADER
            "
            v-model="record.level"
            :disabled="disabled"
            :rater-type="record.type"
          />
          <EmployeeSelect
            v-else
            v-model="record.employeeId"
            :disabled="disabled"
            placeholder="请选择处理员工"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            :disabled="disabled || (model?.length || 0) <= 1"
            danger
            title="删除处理节点"
            type="link"
            @click="removeStage(index)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <Button
      :disabled="disabled || (model?.length || 0) >= 3"
      class="mt-3"
      @click="addStage"
    >
      新增处理节点
    </Button>
  </div>
</template>
