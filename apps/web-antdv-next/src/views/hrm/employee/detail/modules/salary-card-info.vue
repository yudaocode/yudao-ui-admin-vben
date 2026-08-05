<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  message,
} from 'antdv-next';

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
    message.success('工资卡删除成功');
    await load();
  } catch {}
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
      <Button
        v-if="salaryCard?.id && hasAccessByCodes(['hrm:employee:update'])"
        danger
        type="link"
        @click="handleDelete"
      >
        删除
      </Button>
    </template>
    <Descriptions bordered :column="3" size="small">
      <DescriptionsItem label="银行卡号">
        {{ salaryCard?.bankCardNumber || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="开户地区">
        {{ salaryCard?.bankAreaName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="银行名称">
        {{ salaryCard?.bankName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="开户支行" :span="3">
        {{ salaryCard?.bankBranchName || '-' }}
      </DescriptionsItem>
    </Descriptions>
    <SalaryCardForm ref="formRef" @success="load" />
  </Card>
</template>
