<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, message } from 'ant-design-vue';

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
  message.success('工资卡删除成功');
  await load();
}

onMounted(load);
</script>

<template>
  <Card title="工资卡信息" :style="{ marginBottom: '15px' }" :loading="loading">
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'link',
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:employee:update'],
            onClick: openForm,
          },
          {
            label: '删除',
            type: 'link',
            danger: true,
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
    <Descriptions bordered :column="3" size="small">
      <Descriptions.Item label="银行卡号">
        {{ salaryCard?.bankCardNumber || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="开户地区">
        {{ salaryCard?.bankAreaName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="银行名称">
        {{ salaryCard?.bankName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="开户支行" :span="3">
        {{ salaryCard?.bankBranchName || '-' }}
      </Descriptions.Item>
    </Descriptions>
    <FormModal @success="load" />
  </Card>
</template>
