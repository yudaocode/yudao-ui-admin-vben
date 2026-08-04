<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmEmployeeChangeRecordApi } from '#/api/hrm/employee/change-record';

import { onMounted, ref } from 'vue';

import { Table } from 'ant-design-vue';

import { getEmployeeChangeRecordList } from '#/api/hrm/employee/change-record';
import {
  formatHrmDateTime,
  formatHrmEmployeeChangeType,
} from '#/views/hrm/utils/format';
const props = defineProps<{
  employee: HrmEmployeeApi.Employee;
  employeeId: number;
}>();
const emit = defineEmits(['success']);
const loading = ref(false);
const list = ref<HrmEmployeeChangeRecordApi.EmployeeChangeRecord[]>([]);
async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeChangeRecordList(props.employeeId);
  } finally {
    loading.value = false;
  }
}
onMounted(getList);
defineExpose({ getList });
</script>
<template>
  <Table
    :loading="loading"
    :data-source="list"
    :pagination="false"
    :row-key="(r) => r.id"
    bordered
    size="small"
    :columns="[
      {
        title: '异动类型',
        dataIndex: 'type',
        customRender: ({ record }) => formatHrmEmployeeChangeType(record.type),
      },
      { title: '原部门', dataIndex: 'oldDeptName' },
      { title: '新部门', dataIndex: 'newDeptName' },
      { title: '原岗位', dataIndex: 'oldPostName' },
      { title: '新岗位', dataIndex: 'newPostName' },
      {
        title: '生效日期',
        dataIndex: 'effectTime',
        customRender: ({ text }) => formatHrmDateTime(text),
      },
    ]"
  />
</template>
