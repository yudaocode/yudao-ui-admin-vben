<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmEmployeeChangeRecordApi } from '#/api/hrm/employee/change-record';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { Button, Table } from 'ant-design-vue';

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
      <Button type="primary" @click="openForm">新增</Button>
    </div>
    <Table
      :loading="loading"
      :data-source="list"
      :pagination="false"
      :row-key="(r) => r.id"
      :scroll="{ x: 1600 }"
      bordered
      size="small"
      :columns="[
        {
          title: '异动类型',
          dataIndex: 'type',
          width: 120,
          customRender: ({ record }) =>
            formatHrmEmployeeChangeType(record.type),
        },
        { title: '原部门', dataIndex: 'oldDeptName', width: 120 },
        { title: '新部门', dataIndex: 'newDeptName', width: 120 },
        { title: '原岗位', dataIndex: 'oldPostName', width: 120 },
        { title: '新岗位', dataIndex: 'newPostName', width: 120 },
        { title: '原职级', dataIndex: 'oldPostLevel', width: 100 },
        { title: '新职级', dataIndex: 'newPostLevel', width: 100 },
        { title: '原工作地点', dataIndex: 'oldWorkAddress', width: 140 },
        { title: '新工作地点', dataIndex: 'newWorkAddress', width: 140 },
        {
          title: '原直属上级',
          dataIndex: 'oldLeaderEmployeeName',
          width: 120,
        },
        {
          title: '新直属上级',
          dataIndex: 'newLeaderEmployeeName',
          width: 120,
        },
        {
          title: '生效日期',
          dataIndex: 'effectTime',
          width: 120,
          customRender: ({ text }) => formatHrmDateTime(text),
        },
        { title: '备注', dataIndex: 'remark', width: 160 },
      ]"
    />
    <PositionChangeModal @success="handleSuccess" />
  </div>
</template>
