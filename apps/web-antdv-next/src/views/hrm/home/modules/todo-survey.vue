<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';

import { Card } from 'antdv-next';

import {
  HrmEmployeeStatusTab,
  HrmEmployeeTodoType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmHomeTodoSurvey' });

const props = defineProps<{
  survey?: HrmHomeApi.HrHomeTodoSurvey;
}>();

type TodoAction =
  | 'birthday'
  | 'contract'
  | 'entry'
  | 'leave'
  | 'regular'
  | 'salary';

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canQueryEmployee = hasAccessByCodes(['hrm:employee:query']);
const canQuerySalary = hasAccessByCodes(['hrm:salary:month-record:query']);

const todoItems = computed(() => [
  {
    action: 'salary' as TodoAction,
    disabled: !canQuerySalary || !props.survey?.toSalaryComputeCount,
    label: '待核算薪资',
    unit: '条',
    value: props.survey?.toSalaryComputeCount || 0,
  },
  {
    action: 'leave' as TodoAction,
    disabled: !canQueryEmployee,
    label: '待离职',
    unit: '人',
    value: props.survey?.toLeaveCount || 0,
  },
  {
    action: 'contract' as TodoAction,
    disabled: !canQueryEmployee,
    label: '合同到期',
    unit: '人',
    value: props.survey?.toExpireContractCount || 0,
  },
  {
    action: 'regular' as TodoAction,
    disabled: !canQueryEmployee,
    label: '待转正',
    unit: '人',
    value: props.survey?.toRegularCount || 0,
  },
  {
    action: 'entry' as TodoAction,
    disabled: !canQueryEmployee,
    label: '待入职',
    unit: '人',
    value: props.survey?.toEntryCount || 0,
  },
  {
    action: 'birthday' as TodoAction,
    disabled: !canQueryEmployee,
    label: '生日',
    unit: '人',
    value: props.survey?.toBirthdayCount || 0,
  },
]);

/** 打开待办对应的业务列表 */
function goTodo(action: TodoAction) {
  if (action === 'salary') {
    if (canQuerySalary) {
      router.push({ name: 'HrmSalaryMonthRecord' });
    }
    return;
  }
  if (!canQueryEmployee) {
    return;
  }
  const employeeFilters = {
    birthday: {
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
      todoType: HrmEmployeeTodoType.BIRTHDAY,
    },
    contract: {
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
      todoType: HrmEmployeeTodoType.CONTRACT_EXPIRE,
    },
    entry: {
      statusCategory: HrmEmployeeStatusTab.PENDING_ENTRY,
      todoType: HrmEmployeeTodoType.PENDING_ENTRY,
    },
    leave: {
      statusCategory: HrmEmployeeStatusTab.PENDING_LEAVE,
      todoType: HrmEmployeeTodoType.PENDING_LEAVE,
    },
    regular: {
      statusCategory: HrmEmployeeStatusTab.ACTIVE,
      todoType: HrmEmployeeTodoType.REGULAR,
    },
  };
  router.push({ name: 'HrmEmployee', query: employeeFilters[action] });
}
</script>

<template>
  <Card title="待办提醒">
    <div class="grid grid-cols-3 gap-y-5">
      <button
        v-for="todo in todoItems"
        :key="todo.label"
        :disabled="todo.disabled"
        class="relative flex min-h-[78px] flex-col items-center justify-center border-0 bg-transparent"
        :class="todo.disabled ? 'cursor-default' : 'group cursor-pointer'"
        type="button"
        @click="goTodo(todo.action)"
      >
        <strong class="text-[22px] leading-7 group-hover:text-primary">
          {{ todo.value }}
        </strong>
        <span
          class="text-muted-foreground mt-1.5 text-[13px] group-hover:text-primary"
        >
          {{ todo.label }}
        </span>
        <small
          class="text-muted-foreground/70 absolute left-[calc(50%+18px)] top-[18px]"
        >
          {{ todo.unit }}
        </small>
      </button>
    </div>
  </Card>
</template>
