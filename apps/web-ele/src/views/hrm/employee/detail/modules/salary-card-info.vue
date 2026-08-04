<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { getEmployeeSalaryCard } from '#/api/hrm/employee/salary-card';

import SalaryCardForm from './salary-card-form.vue';
const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const salaryCard = ref<any>();
const formRef = ref<InstanceType<typeof SalaryCardForm>>();
async function load() {
  loading.value = true;
  try {
    salaryCard.value = await getEmployeeSalaryCard(props.employeeId);
  } finally {
    loading.value = false;
  }
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
    </template>
    <ElDescriptions bordered :column="3" size="small">
      <ElDescriptionsItem label="银行卡号">
        {{ salaryCard?.bankCardNumber || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="银行名称">
        {{ salaryCard?.bankName || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="开户支行">
        {{ salaryCard?.bankBranchName || '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>
    <SalaryCardForm ref="formRef" @success="load" />
  </ElCard>
</template>
