<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { Button, message, Table } from 'antdv-next';

import {
  deleteEmployeeWorkExperience,
  getEmployeeWorkExperienceList,
} from '#/api/hrm/employee/work-experience';
import { $t } from '#/locales';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import Form from './work-form.vue';

defineOptions({ name: 'HrmEmployeeWorkList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeWorkExperienceApi.EmployeeWorkExperience[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeWorkExperienceList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeWorkExperienceApi.EmployeeWorkExperience) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeWorkExperience(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

const columns: TableColumnsType<HrmEmployeeWorkExperienceApi.EmployeeWorkExperience> =
  [
    { title: '工作单位', dataIndex: 'workUnit', key: 'workUnit' },
    { title: '职务', dataIndex: 'postName', key: 'postName' },
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
    { title: '离职原因', dataIndex: 'reason', key: 'reason' },
    { title: '证明人', dataIndex: 'witnessName', key: 'witnessName' },
    {
      title: '证明人电话',
      dataIndex: 'witnessPhone',
      key: 'witnessPhone',
    },
    { title: '工作备注', dataIndex: 'remark', key: 'remark' },
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
