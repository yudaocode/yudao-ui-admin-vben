<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { Button, message, Table } from 'antdv-next';

import {
  deleteEmployeeContract,
  getEmployeeContractList,
} from '#/api/hrm/employee/contract';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import {
  formatHrmDateTime,
  formatHrmEmployeeContractStatus,
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
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeContract(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

const columns: TableColumnsType<HrmEmployeeContractApi.EmployeeContract> = [
  { title: '合同编号', dataIndex: 'no', width: 150 },
  {
    title: '合同类型',
    dataIndex: 'type',
    key: 'type',
    width: 110,
  },
  {
    title: '开始日期',
    dataIndex: 'startTime',
    key: 'startTime',
    width: 120,
  },
  {
    title: '结束日期',
    dataIndex: 'endTime',
    key: 'endTime',
    width: 120,
  },
  {
    title: '期限',
    key: 'term',
    width: 90,
  },
  {
    title: '合同状态',
    key: 'status',
    width: 110,
  },
  { title: '签约公司', dataIndex: 'signCompany', width: 150 },
  {
    title: '签订日期',
    dataIndex: 'signTime',
    key: 'signTime',
    width: 120,
  },
  {
    title: '到期提醒',
    key: 'expireRemind',
    width: 100,
  },
  { title: '备注', dataIndex: 'remark', width: 160 },
  { title: '附件', key: 'files', width: 180 },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

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
      row-key="id"
      :scroll="{ x: 1600 }"
      :columns="columns"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          {{ formatHrmEmployeeContractType(record.type) }}
        </template>
        <template v-else-if="column.key === 'startTime'">
          {{ formatHrmDateTime(record.startTime) }}
        </template>
        <template v-else-if="column.key === 'endTime'">
          {{ formatHrmDateTime(record.endTime) }}
        </template>
        <template v-else-if="column.key === 'signTime'">
          {{ formatHrmDateTime(record.signTime) }}
        </template>
        <template v-else-if="column.key === 'term'">
          {{ record.term != null ? `${record.term} 年` : '-' }}
        </template>
        <template v-else-if="column.key === 'status'">
          {{ formatHrmEmployeeContractStatus(record.status) }}
        </template>
        <template v-else-if="column.key === 'expireRemind'">
          <DictTag
            v-if="record.expireRemind != null"
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="record.expireRemind"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'files'">
          <div v-if="record.fileUrls?.length" class="flex flex-col items-start">
            <Button
              v-for="url in record.fileUrls"
              :key="url"
              type="link"
              class="!h-auto !px-0"
              @click="openWindow(url)"
            >
              {{ getFileNameFromUrl(url) }}
            </Button>
          </div>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'action'">
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
