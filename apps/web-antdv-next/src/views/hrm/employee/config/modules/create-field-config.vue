<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';

import { onMounted, ref } from 'vue';

import { message, Switch, Table } from 'antdv-next';

import {
  getEmployeeCreateFieldConfigList,
  saveEmployeeCreateFieldConfig,
} from '#/api/hrm/employee/config';
import { HrmEmployeeEntryStatus } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmEmployeeCreateFieldConfig' });

type FieldRow = HrmEmployeeConfigApi.FieldConfig & {
  activeVisible: boolean;
  activeVisibleLocked: boolean;
  pendingEntryVisible: boolean;
  pendingEntryVisibleLocked: boolean;
};

const loading = ref(false);
const list = ref<FieldRow[]>([]);

const columns: TableColumnsType<FieldRow> = [
  { title: '字段分组', dataIndex: 'groupName', key: 'groupName', width: 180 },
  { title: '字段名称', dataIndex: 'title', key: 'title' },
  { title: '新建在职员工', key: 'active', align: 'center', width: 180 },
  { title: '新建待入职员工', key: 'pending', align: 'center', width: 180 },
];

async function getList() {
  loading.value = true;
  try {
    const [activeFields, pendingEntryFields] = await Promise.all([
      getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
      getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY),
    ]);
    const pendingMap = new Map(
      pendingEntryFields.map((field) => [field.name, field]),
    );
    list.value = activeFields.map((field) => {
      const pending = pendingMap.get(field.name)!;
      return {
        ...field,
        activeVisible: field.visible,
        activeVisibleLocked: field.visibleLocked,
        pendingEntryVisible: pending.visible,
        pendingEntryVisibleLocked: pending.visibleLocked,
      };
    });
  } finally {
    loading.value = false;
  }
}

function getVisibleFields(field: 'activeVisible' | 'pendingEntryVisible') {
  return list.value.map((item) => ({ name: item.name, visible: item[field] }));
}

async function submitForm() {
  // 串行保存，避免并行写配置触发后端偶发「系统异常」
  await saveEmployeeCreateFieldConfig({
    entryStatus: HrmEmployeeEntryStatus.ACTIVE,
    fields: getVisibleFields('activeVisible'),
  });
  await saveEmployeeCreateFieldConfig({
    entryStatus: HrmEmployeeEntryStatus.PENDING_ENTRY,
    fields: getVisibleFields('pendingEntryVisible'),
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
        v-if="column.key === 'active'"
        v-model:checked="record.activeVisible"
        :disabled="record.activeVisibleLocked"
      />
      <Switch
        v-else-if="column.key === 'pending'"
        v-model:checked="record.pendingEntryVisible"
        :disabled="record.pendingEntryVisibleLocked"
      />
    </template>
  </Table>
</template>
