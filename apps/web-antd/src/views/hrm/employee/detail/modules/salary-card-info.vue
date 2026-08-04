<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Card, Descriptions } from 'ant-design-vue';

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
  <Card title="工资卡信息" :style="{ marginBottom: '15px' }" :loading="loading">
    <template #extra>
      <Button
        v-if="hasAccessByCodes(['hrm:employee:update'])"
        type="link"
        @click="formRef?.open(employeeId, salaryCard)"
      >
        编辑
      </Button>
    </template>
    <Descriptions bordered :column="3" size="small">
      <Descriptions.Item label="银行卡号">
        {{ salaryCard?.bankCardNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="银行名称">
        {{ salaryCard?.bankName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="开户支行">
        {{ salaryCard?.bankBranchName || '-' }}
      </Descriptions.Item>
    </Descriptions>
    <SalaryCardForm ref="formRef" @success="load" />
  </Card>
</template>
