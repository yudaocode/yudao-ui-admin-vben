<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { Button, Select, TreeSelect } from 'antdv-next';

import { getSimpleDeptList } from '#/api/system/dept';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmPerformancePlanScopeType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPerformancePlanScopeForm' });

const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});

const model = defineModel<HrmPerformancePlanApi.PerformanceScope[]>({
  required: true,
});

const deptTree = ref<SystemDeptApi.Dept[]>([]);

const hasEmployeeDeptScope = computed(() =>
  model.value.some(
    (scope) => scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
  ),
);

function createScope(
  type: number = HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
): HrmPerformancePlanApi.PerformanceScope {
  return type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT
    ? { type, employeeIds: [], deptIds: [] }
    : { type, employeeType: HrmEmployeeType.FORMAL, employeeStatuses: [] };
}

function addScope() {
  if ((model.value?.length || 0) >= 3) return;
  const type = hasEmployeeDeptScope.value
    ? HrmPerformancePlanScopeType.EMPLOYMENT
    : HrmPerformancePlanScopeType.EMPLOYEE_DEPT;
  model.value = [...model.value, createScope(type)];
}

function removeScope(index: number) {
  if ((model.value?.length || 0) <= 1) return;
  model.value = model.value.filter((_, scopeIndex) => scopeIndex !== index);
}

function handleScopeTypeChange(scope: HrmPerformancePlanApi.PerformanceScope) {
  const replacement = createScope(scope.type);
  const index = model.value.indexOf(scope);
  if (index !== -1) model.value.splice(index, 1, replacement);
}

function handleEmployTypeChange(scope: HrmPerformancePlanApi.PerformanceScope) {
  scope.employeeStatuses = [];
}

function getEmployeeStatusOptions(employType?: number) {
  if (employType === HrmEmployeeType.INFORMAL) {
    const labelMap: Record<number, string> = {
      [HrmEmployeeStatus.INTERN]: '实习',
      [HrmEmployeeStatus.PART_TIME]: '兼职',
      [HrmEmployeeStatus.LABOR]: '劳务',
      [HrmEmployeeStatus.CONSULTANT]: '顾问',
      [HrmEmployeeStatus.REHIRE]: '返聘',
      [HrmEmployeeStatus.OUTSOURCE]: '外包',
    };
    return HRM_EMPLOYEE_NON_FORMAL_STATUSES.map((value) => ({
      value,
      label: labelMap[value],
    }));
  }
  return [
    { label: '正式', value: HrmEmployeeStatus.REGULAR },
    { label: '试用', value: HrmEmployeeStatus.PROBATION },
  ];
}

onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList());
});
</script>

<template>
  <div class="w-full space-y-3">
    <div
      v-for="(scope, index) in model"
      :key="index"
      class="flex flex-wrap items-center gap-3"
    >
      <div class="w-[150px] shrink-0">
        <Select
          v-model:value="scope.type"
          :disabled="disabled"
          :options="[
            {
              label: '员工部门',
              value: HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
              disabled:
                hasEmployeeDeptScope &&
                scope.type !== HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
            },
            {
              label: '聘用形式',
              value: HrmPerformancePlanScopeType.EMPLOYMENT,
            },
          ]"
          class="w-full"
          placeholder="请选择范围类型"
          @change="handleScopeTypeChange(scope)"
        />
      </div>
      <template v-if="scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT">
        <div class="w-[280px] shrink-0">
          <HrmEmployeeMultiSelect
            v-model="scope.employeeIds"
            :disabled="disabled"
            placeholder="请选择员工"
            title="选择员工"
          />
        </div>
        <div class="w-[280px] shrink-0">
          <TreeSelect
            v-model:value="scope.deptIds"
            :disabled="disabled"
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
            :tree-data="deptTree"
            allow-clear
            class="w-full"
            multiple
            placeholder="请选择部门"
            tree-default-expand-all
            tree-checkable
          />
        </div>
      </template>
      <template v-else>
        <div class="w-[280px] shrink-0">
          <Select
            v-model:value="scope.employeeType"
            :disabled="disabled"
            :options="[
              { label: '正式', value: HrmEmployeeType.FORMAL },
              { label: '非正式', value: HrmEmployeeType.INFORMAL },
            ]"
            class="w-full"
            placeholder="请选择聘用形式"
            @change="handleEmployTypeChange(scope)"
          />
        </div>
        <div class="w-[280px] shrink-0">
          <Select
            v-model:value="scope.employeeStatuses"
            :disabled="disabled"
            :options="getEmployeeStatusOptions(scope.employeeType)"
            class="w-full"
            mode="multiple"
            placeholder="请选择员工状态"
          />
        </div>
      </template>
      <Button
        :disabled="disabled || model.length <= 1"
        class="shrink-0"
        danger
        title="删除考核范围"
        type="link"
        @click="removeScope(index)"
      >
        删除
      </Button>
    </div>
    <Button :disabled="disabled || model.length >= 3" @click="addScope">
      新增考核范围
    </Button>
  </div>
</template>
