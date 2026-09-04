<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmEmployeeChangeRecordApi } from '#/api/hrm/employee/change-record';

import { useVbenModal } from '@vben/common-ui';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEmployeeChangeRecordList } from '#/api/hrm/employee/change-record';

import PositionChangeForm from '../../modules/position-change-form.vue';
import { useEmployeeChangeRecordGridColumns } from '../data';

const props = defineProps<{
  employee: HrmEmployeeApi.Employee;
  employeeId: number;
}>();
const emit = defineEmits(['success']);

/** 异动记录「新增」仅办理调岗，与源 EmployeeChangeRecordList 一致 */
const [PositionChangeModal, positionChangeModalApi] = useVbenModal({
  connectedComponent: PositionChangeForm,
  destroyOnClose: true,
});

function openForm() {
  positionChangeModalApi
    .setData({ employee: props.employee, mode: 'transfer' })
    .open();
}

async function handleSuccess() {
  await gridApi.query();
  emit('success');
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useEmployeeChangeRecordGridColumns(),
    minHeight: 220,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeChangeRecordList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeChangeRecordApi.EmployeeChangeRecord>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="异动记录">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:employee:update'],
              onClick: openForm,
            },
          ]"
        />
      </template>
    </Grid>
    <PositionChangeModal @success="handleSuccess" />
  </div>
</template>
