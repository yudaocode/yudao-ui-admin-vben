<script lang="ts" setup>
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { onMounted, ref } from 'vue';

import { ElMessage } from 'element-plus';

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
  ElMessage.success('保存成功');
  await getList();
}

onMounted(getList);
defineExpose({ submitForm });
</script>

<template>
  <ElTable v-loading="loading" border :data="list">
    <ElTableColumn label="字段分组" prop="groupName" width="180" />
    <ElTableColumn label="字段名称" prop="title" />
    <ElTableColumn align="center" label="员工是否可见" width="160">
      <template #default="{ row }">
        <ElSwitch
          v-model="row.visible"
          :disabled="row.visibleLocked"
          @change="handleVisibleChange(row)"
        />
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="员工是否可编辑" width="160">
      <template #default="{ row }">
        <ElSwitch
          v-model="row.editable"
          :disabled="!row.visible || row.editableLocked"
          @change="handleEditableChange(row)"
        />
      </template>
    </ElTableColumn>
  </ElTable>
</template>
