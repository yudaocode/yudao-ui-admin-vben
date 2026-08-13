<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message, Space, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAttendanceGroup,
  getAttendanceGroupPage,
} from '#/api/hrm/attendance/group';
import { $t } from '#/locales';
import { formatHrmAttendanceWeeks } from '#/views/hrm/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmAttendanceGroup' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(row: HrmAttendanceGroupApi.AttendanceGroup) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(row: HrmAttendanceGroupApi.AttendanceGroup) {
  await confirm(`确认删除考勤组"${row.name}"吗？`);
  await deleteAttendanceGroup(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          getAttendanceGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmAttendanceGroupApi.AttendanceGroup>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【考勤】考勤管理"
        url="https://doc.iocoder.cn/hrm/attendance/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:attendance:group:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #shifts="{ row }">
        <Space wrap>
          <Tag v-for="(shift, index) in row.shifts || []" :key="index">
            {{ formatHrmAttendanceWeeks(shift.weeks) }} {{ shift.startTime }}-{{
              shift.endTime
            }}
          </Tag>
          <span v-if="!row.shifts?.length">-</span>
        </Space>
      </template>
      <template #scope="{ row }">
        <div v-if="row.deptNames?.length">
          部门：{{ row.deptNames.join('、') }}
        </div>
        <div v-if="row.employeeNames?.length">
          员工：{{ row.employeeNames.join('、') }}
        </div>
        <span v-if="!row.deptNames?.length && !row.employeeNames?.length">-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['hrm:attendance:group:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:attendance:group:delete'],
              disabled: row.defaultStatus,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
