<script lang="ts" setup>
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeContract,
  getEmployeeContractList,
} from '#/api/hrm/employee/contract';
import { $t } from '#/locales';
import {
  formatHrmDateTime,
  formatHrmEmployeeContractType,
} from '#/views/hrm/utils/format';

import ContractForm from './contract-form.vue';

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const list = ref<HrmEmployeeContractApi.EmployeeContract[]>([]);
const formRef = ref<InstanceType<typeof ContractForm>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeContractList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id?: number) {
  if (!id) return;
  await deleteEmployeeContract(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  await getList();
}

onMounted(getList);
</script>

<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <ElButton type="primary" @click="formRef?.open(employeeId)">
        新增
      </ElButton>
    </div>
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="合同编码" min-width="120" prop="no" />
      <ElTableColumn label="合同类型" min-width="160">
        <template #default="{ row }">
          {{ formatHrmEmployeeContractType(row.type) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="开始日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.startTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="结束日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.endTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="140">
        <template #default="{ row }">
          <ElButton
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            link
            type="primary"
            @click="formRef?.open(employeeId, row)"
          >
            编辑
          </ElButton>
          <ElButton
            v-if="hasAccessByCodes(['hrm:employee:delete'])"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ContractForm ref="formRef" @success="getList" />
  </div>
</template>
