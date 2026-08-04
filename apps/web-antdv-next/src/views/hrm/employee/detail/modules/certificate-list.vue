<script lang="ts" setup>
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, message, Table } from 'antdv-next';

import {
  deleteEmployeeCertificate,
  getEmployeeCertificateList,
} from '#/api/hrm/employee/certificate';
import { $t } from '#/locales';

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
  const hide = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
  });
  try {
    await deleteEmployeeCertificate(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    hide();
  }
}

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
      :columns="[
        { title: '证书名称', dataIndex: 'name', key: 'name' },
        { title: '证书级别', dataIndex: 'level', key: 'level' },
        { title: '证书编码', dataIndex: 'no', key: 'no' },
        {
          title: '发证机构',
          dataIndex: 'issuingAuthority',
          key: 'issuingAuthority',
        },
        { title: '操作', key: 'action', width: 140 },
      ]"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => row.id as any"
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
