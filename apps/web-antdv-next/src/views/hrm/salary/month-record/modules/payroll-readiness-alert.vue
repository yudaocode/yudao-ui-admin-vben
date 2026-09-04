<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Button } from 'antdv-next';

import { getSalaryPayrollReadiness } from '#/api/hrm/salary/month-record';

import PayrollReadinessEmployeeList from './payroll-readiness-employee-list.vue';

defineOptions({ name: 'HrmSalaryPayrollReadinessAlert' });

const props = defineProps<{
  monthRecordId?: number;
}>();

const readiness = ref<HrmSalaryMonthRecordApi.PayrollReadiness>();

const [NoSalaryGroupModal, noSalaryGroupModalApi] = useVbenModal({
  destroyOnClose: true,
  footer: false,
  title: '未加入薪资组的员工',
});

const [NoSalaryModal, noSalaryModalApi] = useVbenModal({
  destroyOnClose: true,
  footer: false,
  title: '未设置薪资档案的员工',
});

async function refresh() {
  if (!props.monthRecordId) {
    readiness.value = undefined;
    return;
  }
  readiness.value = await getSalaryPayrollReadiness(props.monthRecordId);
}

watch(
  () => props.monthRecordId,
  () => {
    refresh();
  },
  { immediate: true },
);

defineExpose({ refresh });
</script>

<template>
  <div>
    <Alert
      v-if="readiness?.noSalaryGroupEmployeeCount"
      show-icon
      type="warning"
      :style="{ marginTop: '8px' }"
    >
      <template #message>
        有
        {{ readiness.noSalaryGroupEmployeeCount }}
        名员工未加入任何薪资组，无法参与工资核算。
        <Button type="link" @click="noSalaryGroupModalApi.open()">
          查看员工
        </Button>
      </template>
    </Alert>
    <Alert
      v-if="readiness?.noSalaryEmployeeCount"
      show-icon
      type="warning"
      :style="{ marginTop: '8px' }"
    >
      <template #message>
        有 {{ readiness.noSalaryEmployeeCount }}
        名员工没有生效薪资档案，将优先继承上月工资；无上月工资时按 0 核算。
        <Button type="link" @click="noSalaryModalApi.open()">查看员工</Button>
      </template>
    </Alert>

    <NoSalaryGroupModal class="w-[860px]">
      <PayrollReadinessEmployeeList :list="readiness?.noSalaryGroupEmployees" />
    </NoSalaryGroupModal>
    <NoSalaryModal class="w-[860px]">
      <PayrollReadinessEmployeeList :list="readiness?.noSalaryEmployees" />
    </NoSalaryModal>
  </div>
</template>
