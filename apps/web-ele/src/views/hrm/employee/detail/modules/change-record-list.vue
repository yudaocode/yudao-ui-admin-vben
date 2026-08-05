<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmEmployeeChangeRecordApi } from '#/api/hrm/employee/change-record';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElTable, ElTableColumn } from 'element-plus';

import { getEmployeeChangeRecordList } from '#/api/hrm/employee/change-record';
import {
  formatHrmDateTime,
  formatHrmEmployeeChangeType,
} from '#/views/hrm/utils/format';

import PositionChangeForm from '../../modules/position-change-form.vue';

const props = defineProps<{
  employee: HrmEmployeeApi.Employee;
  employeeId: number;
}>();
const emit = defineEmits(['success']);
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeChangeRecordApi.EmployeeChangeRecord[]>([]);

/** 异动记录「新增」仅办理调岗，与源 EmployeeChangeRecordList 一致 */
const [PositionChangeModal, positionChangeModalApi] = useVbenModal({
  connectedComponent: PositionChangeForm,
  destroyOnClose: true,
});

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeChangeRecordList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm() {
  positionChangeModalApi
    .setData({ employee: props.employee, mode: 'transfer' })
    .open();
}

async function handleSuccess() {
  await getList();
  emit('success');
}

onMounted(getList);
defineExpose({ getList });
</script>
<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <ElButton type="primary" @click="openForm">新增</ElButton>
    </div>
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
      <ElTableColumn label="原职级" min-width="100" prop="oldPostLevel" />
      <ElTableColumn label="新职级" min-width="100" prop="newPostLevel" />
      <ElTableColumn label="原工作地点" min-width="140" prop="oldWorkAddress" />
      <ElTableColumn label="新工作地点" min-width="140" prop="newWorkAddress" />
      <ElTableColumn
        label="原直属上级"
        min-width="120"
        prop="oldLeaderEmployeeName"
      />
      <ElTableColumn
        label="新直属上级"
        min-width="120"
        prop="newLeaderEmployeeName"
      />
      <ElTableColumn label="生效日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.effectTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="160" prop="remark" />
    </ElTable>
    <PositionChangeModal @success="handleSuccess" />
  </div>
</template>
