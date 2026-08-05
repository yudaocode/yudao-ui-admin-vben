<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { Button, message, Table } from 'antdv-next';

import {
  deleteEmployeeCertificate,
  getEmployeeCertificateList,
} from '#/api/hrm/employee/certificate';
import { $t } from '#/locales';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import Form from './certificate-form.vue';

defineOptions({ name: 'HrmEmployeeCertificateList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeCertificateApi.EmployeeCertificate[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeCertificateList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeCertificateApi.EmployeeCertificate) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeCertificate(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

const columns: TableColumnsType<HrmEmployeeCertificateApi.EmployeeCertificate> =
  [
    { title: '证书名称', dataIndex: 'name', key: 'name' },
    { title: '证书级别', dataIndex: 'level', key: 'level' },
    { title: '证书编号', dataIndex: 'no', key: 'no' },
    {
      title: '有效开始日期',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
    },
    {
      title: '有效结束日期',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
    },
    {
      title: '发证机构',
      dataIndex: 'issuingAuthority',
      key: 'issuingAuthority',
    },
    {
      title: '发证日期',
      dataIndex: 'issuingTime',
      key: 'issuingTime',
      width: 120,
    },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '操作', key: 'action', width: 140, fixed: 'right' },
  ];

onMounted(() => getList());
defineExpose({ getList });
</script>

<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <Button type="primary" @click="openForm()">新增</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1200 }"
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'startTime'">
          {{ formatHrmDateTime(record.startTime) }}
        </template>
        <template v-else-if="column.key === 'endTime'">
          {{ formatHrmDateTime(record.endTime) }}
        </template>
        <template v-else-if="column.key === 'issuingTime'">
          {{ formatHrmDateTime(record.issuingTime) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            type="link"
            @click="openForm(record)"
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
    <Form ref="formRef" @success="getList" />
  </div>
</template>
