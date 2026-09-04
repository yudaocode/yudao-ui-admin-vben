<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElMessage,
} from 'element-plus';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  deleteEmployeeSalaryCard,
  getEmployeeSalaryCard,
} from '#/api/hrm/employee/salary-card';

import SalaryCardForm from './salary-card-form.vue';

const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const salaryCard = ref<HrmEmployeeSalaryCardApi.EmployeeSalaryCard>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: SalaryCardForm,
  destroyOnClose: true,
});

async function load() {
  loading.value = true;
  try {
    salaryCard.value = await getEmployeeSalaryCard(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm() {
  formModalApi
    .setData({ employeeId: props.employeeId, row: salaryCard.value })
    .open();
}

async function handleDelete() {
  await deleteEmployeeSalaryCard(props.employeeId);
  ElMessage.success('工资卡删除成功');
  await load();
}

onMounted(load);
</script>

<template>
  <ElCard
    v-loading="loading"
    header="工资卡信息"
    :style="{ marginBottom: '15px' }"
    shadow="never"
  >
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'primary',
            link: true,
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:employee:update'],
            onClick: openForm,
          },
          {
            label: '删除',
            type: 'danger',
            link: true,
            icon: ACTION_ICON.DELETE,
            auth: ['hrm:employee:update'],
            ifShow: !!salaryCard?.id,
            popConfirm: {
              title: '确定删除当前员工的工资卡信息吗？',
              confirm: handleDelete,
            },
          },
        ]"
      />
    </template>
    <ElDescriptions border :column="3" size="small">
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
    <FormModal @success="load" />
  </ElCard>
</template>
