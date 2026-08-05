<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { ElButton, ElOption, ElSelect, ElTreeSelect } from 'element-plus';

import { getSimpleDeptList } from '#/api/system/dept';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
import {
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmPerformancePlanScopeType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPerformancePlanScopeForm' });

withDefaults(defineProps<{ disabled?: boolean }>(), { disabled: false });

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
        <ElSelect
          v-model="scope.type"
          :disabled="disabled"
          class="!w-full"
          placeholder="请选择范围类型"
          @change="handleScopeTypeChange(scope)"
        >
          <ElOption
            label="员工部门"
            :value="HrmPerformancePlanScopeType.EMPLOYEE_DEPT"
            :disabled="
              hasEmployeeDeptScope &&
              scope.type !== HrmPerformancePlanScopeType.EMPLOYEE_DEPT
            "
          />
          <ElOption
            label="聘用形式"
            :value="HrmPerformancePlanScopeType.EMPLOYMENT"
          />
        </ElSelect>
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
          <ElTreeSelect
            v-model="scope.deptIds"
            :data="deptTree"
            :disabled="disabled"
            :props="{ label: 'name', children: 'children' }"
            check-strictly
            class="!w-full"
            clearable
            default-expand-all
            multiple
            node-key="id"
            placeholder="请选择部门"
            show-checkbox
          />
        </div>
      </template>
      <template v-else>
        <div class="w-[280px] shrink-0">
          <ElSelect
            v-model="scope.employeeType"
            :disabled="disabled"
            class="!w-full"
            placeholder="请选择聘用形式"
            @change="handleEmployTypeChange(scope)"
          >
            <ElOption label="正式" :value="HrmEmployeeType.FORMAL" />
            <ElOption label="非正式" :value="HrmEmployeeType.INFORMAL" />
          </ElSelect>
        </div>
        <div class="w-[280px] shrink-0">
          <ElSelect
            v-model="scope.employeeStatuses"
            :disabled="disabled"
            class="!w-full"
            clearable
            multiple
            placeholder="请选择员工状态"
          >
            <ElOption
              v-for="item in getEmployeeStatusOptions(scope.employeeType)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </div>
      </template>
      <ElButton
        :disabled="disabled || model.length <= 1"
        class="shrink-0"
        link
        title="删除考核范围"
        type="danger"
        @click="removeScope(index)"
      >
        删除
      </ElButton>
    </div>
    <ElButton :disabled="disabled || model.length >= 3" @click="addScope">
      新增考核范围
    </ElButton>
  </div>
</template>
