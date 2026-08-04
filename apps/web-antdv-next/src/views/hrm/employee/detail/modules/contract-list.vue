<script lang="ts" setup>
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, message, Table } from 'antdv-next';

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
  message.success($t('ui.actionMessage.deleteSuccess'));
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
      <Button type="primary" @click="formRef?.open(employeeId)">新增</Button>
    </div>
    <Table
      bordered
      size="small"
      :loading="loading"
      :data-source="list"
      :pagination="false"
      :row-key="(r) => r.id as any"
      :columns="
        [
          { title: '合同编码', dataIndex: 'no' },
          {
            title: '合同类型',
            dataIndex: 'type',
            customRender: ({ record }: any) =>
              formatHrmEmployeeContractType(record.type),
          },
          {
            title: '开始日期',
            dataIndex: 'startTime',
            customRender: ({ text }: any) => formatHrmDateTime(text),
          },
          {
            title: '结束日期',
            dataIndex: 'endTime',
            customRender: ({ text }: any) => formatHrmDateTime(text),
          },
          { title: '操作', key: 'action' },
        ] as any
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            type="link"
            @click="formRef?.open(employeeId, record)"
          >
            编辑
          </Button>
          <Button
            v-if="hasAccessByCodes(['hrm:employee:delete'])"
            danger
            type="link"
            @click="handleDelete(record.id)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <ContractForm ref="formRef" @success="getList" />
  </div>
</template>
