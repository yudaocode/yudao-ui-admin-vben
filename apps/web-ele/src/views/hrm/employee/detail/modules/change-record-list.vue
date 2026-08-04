<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmEmployeeChangeRecordApi } from '#/api/hrm/employee/change-record';

import { onMounted, ref } from 'vue';

import { ElTable, ElTableColumn } from 'element-plus';

import { getEmployeeChangeRecordList } from '#/api/hrm/employee/change-record';
import {
  formatHrmDateTime,
  formatHrmEmployeeChangeType,
} from '#/views/hrm/utils/format';

const props = defineProps<{
  employee: HrmEmployeeApi.Employee;
  employeeId: number;
}>();
defineEmits(['success']);

const loading = ref(false);
const list = ref<HrmEmployeeChangeRecordApi.ChangeRecord[]>([]);

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
  <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
    <ElTableColumn label="异动类型" min-width="120">
      <template #default="{ row }">
        {{ formatHrmEmployeeChangeType(row.type) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="原部门" min-width="120" prop="oldDeptName" />
    <ElTableColumn label="新部门" min-width="120" prop="newDeptName" />
    <ElTableColumn label="原岗位" min-width="120" prop="oldPostName" />
    <ElTableColumn label="新岗位" min-width="120" prop="newPostName" />
    <ElTableColumn label="生效日期" min-width="120">
      <template #default="{ row }">
        {{ formatHrmDateTime(row.effectTime) }}
      </template>
    </ElTableColumn>
  </ElTable>
</template>
