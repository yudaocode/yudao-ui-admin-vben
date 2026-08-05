<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { Button, message, Table } from 'antdv-next';

import {
  deleteEmployeeContact,
  getEmployeeContactList,
} from '#/api/hrm/employee/contact';
import { $t } from '#/locales';

import Form from './contact-form.vue';

defineOptions({ name: 'HrmEmployeeContactList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeContactApi.EmployeeContact[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeContactList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeContactApi.EmployeeContact) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeContact(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

const columns: TableColumnsType<HrmEmployeeContactApi.EmployeeContact> = [
  { title: '联系人', dataIndex: 'name', key: 'name' },
  { title: '关系', dataIndex: 'relation', key: 'relation' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '工作单位', dataIndex: 'workUnit', key: 'workUnit' },
  { title: '职务', dataIndex: 'postName', key: 'postName' },
  { title: '地址', dataIndex: 'address', key: 'address' },
  { title: '操作', key: 'action', width: 140 },
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
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
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
