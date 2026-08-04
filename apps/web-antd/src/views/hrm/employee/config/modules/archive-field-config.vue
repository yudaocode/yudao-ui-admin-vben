<script lang="ts" setup>
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { onMounted, ref } from 'vue';

import { message, Switch, Table } from 'ant-design-vue';

import {
  getEmployeeArchiveFieldConfigList,
  saveEmployeeArchiveFieldConfig,
} from '#/api/hrm/employee/config';

defineOptions({ name: 'HrmEmployeeArchiveFieldConfig' });

const loading = ref(false);
const list = ref<HrmEmployeeConfigApi.FieldConfig[]>([]);

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
  <Table :data-source="list" :loading="loading" :pagination="false" bordered>
    <Table.Column data-index="groupName" title="字段分组" width="180" />
    <Table.Column data-index="title" title="字段名称" />
    <Table.Column key="visible" title="员工是否可见" align="center" width="160">
      <template #default="{ record }">
        <Switch
          v-model:checked="record.visible"
          :disabled="record.visibleLocked"
          @change="handleVisibleChange(record)"
        />
      </template>
    </Table.Column>
    <Table.Column
      key="editable"
      title="员工是否可编辑"
      align="center"
      width="160"
    >
      <template #default="{ record }">
        <Switch
          v-model:checked="record.editable"
          :disabled="!record.visible || record.editableLocked"
          @change="handleEditableChange(record)"
        />
      </template>
    </Table.Column>
  </Table>
</template>
