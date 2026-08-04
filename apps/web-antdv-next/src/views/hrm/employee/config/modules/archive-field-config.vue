<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { onMounted, ref } from 'vue';

import { message, Switch, Table } from 'antdv-next';

import {
  getEmployeeArchiveFieldConfigList,
  saveEmployeeArchiveFieldConfig,
} from '#/api/hrm/employee/config';

defineOptions({ name: 'HrmEmployeeArchiveFieldConfig' });

const loading = ref(false);
const list = ref<HrmEmployeeConfigApi.FieldConfig[]>([]);

const columns: TableColumnsType<HrmEmployeeConfigApi.FieldConfig> = [
  { title: '字段分组', dataIndex: 'groupName', key: 'groupName', width: 180 },
  { title: '字段名称', dataIndex: 'title', key: 'title' },
  { title: '员工是否可见', key: 'visible', align: 'center', width: 160 },
  { title: '员工是否可编辑', key: 'editable', align: 'center', width: 160 },
];

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeArchiveFieldConfigList();
  } finally {
    loading.value = false;
  }
}

function handleVisibleChange(field: HrmEmployeeConfigApi.FieldConfig) {
  if (!field.visible) field.editable = false;
}

function handleEditableChange(field: HrmEmployeeConfigApi.FieldConfig) {
  if (field.editable) field.visible = true;
}

async function submitForm() {
  await saveEmployeeArchiveFieldConfig({
    fields: list.value.map(({ name, visible, editable }) => ({
      name,
      visible,
      editable,
    })),
  });
  message.success('保存成功');
  await getList();
}

onMounted(getList);
defineExpose({ submitForm });
</script>

<template>
  <Table
    :columns="columns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    bordered
  >
    <template #bodyCell="{ column, record }">
      <Switch
        v-if="column.key === 'visible'"
        v-model:checked="record.visible"
        :disabled="record.visibleLocked"
        @change="handleVisibleChange(record)"
      />
      <Switch
        v-else-if="column.key === 'editable'"
        v-model:checked="record.editable"
        :disabled="!record.visible || record.editableLocked"
        @change="handleEditableChange(record)"
      />
    </template>
  </Table>
</template>
