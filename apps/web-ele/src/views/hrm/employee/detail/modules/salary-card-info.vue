<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
} from 'element-plus';

import {
  deleteEmployeeSalaryCard,
  getEmployeeSalaryCard,
} from '#/api/hrm/employee/salary-card';

import SalaryCardForm from './salary-card-form.vue';

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const salaryCard = ref<HrmEmployeeSalaryCardApi.EmployeeSalaryCard>();
const formRef = ref<InstanceType<typeof SalaryCardForm>>();

async function load() {
  loading.value = true;
  try {
    salaryCard.value = await getEmployeeSalaryCard(props.employeeId);
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  try {
    await confirm('确定删除当前员工的工资卡信息吗？');
    await deleteEmployeeSalaryCard(props.employeeId);
    ElMessage.success('工资卡删除成功');
    await load();
  } catch {}
}

onMounted(load);
</script>
<template>
  <ElCard
    header="工资卡信息"
    :style="{ marginBottom: '15px' }"
    :loading="loading"
  >
    <template #extra>
      <ElButton
        v-if="hasAccessByCodes(['hrm:employee:update'])"
        link
        type="primary"
        @click="formRef?.open(employeeId, salaryCard)"
      >
        编辑
      </ElButton>
      <ElButton
        v-if="salaryCard?.id && hasAccessByCodes(['hrm:employee:update'])"
        link
        type="danger"
        @click="handleDelete"
      >
        删除
      </ElButton>
    </template>
    <ElDescriptions :column="3" border size="small">
      <ElDescriptionsItem label="银行卡号">
        {{ salaryCard?.bankCardNumber || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="开户地区">
        {{ salaryCard?.bankAreaName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="银行名称">
        {{ salaryCard?.bankName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="开户支行" :span="3">
        {{ salaryCard?.bankBranchName || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <SalaryCardForm ref="formRef" @success="load" />
  </ElCard>
</template>
