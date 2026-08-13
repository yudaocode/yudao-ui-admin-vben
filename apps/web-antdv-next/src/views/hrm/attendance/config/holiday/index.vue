<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceHolidayApi } from '#/api/hrm/attendance/holiday';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAttendanceHoliday,
  getAttendanceHolidayPage,
} from '#/api/hrm/attendance/holiday';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmAttendanceHoliday' });

function buildHolidayDateRange(date?: string[]) {
  if (!date?.length) {
    return undefined;
  }
  return [`${date[0]} 00:00:00`, `${date[1]} 23:59:59`];
}

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

function handleEdit(row: HrmAttendanceHolidayApi.AttendanceHoliday) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(row: HrmAttendanceHolidayApi.AttendanceHoliday) {
  await confirm('确认删除该节假日吗？');
  await deleteAttendanceHoliday(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema().map((item) =>
      item.fieldName === 'type'
        ? {
            ...item,
            componentProps: {
              ...item.componentProps,
              options: getDictOptions(
                DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE,
                'number',
              ),
            },
          }
        : item,
    ),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            date: buildHolidayDateRange(formValues.date),
          };
          return getAttendanceHolidayPage(params);
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<HrmAttendanceHolidayApi.AttendanceHoliday>,
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
              auth: ['hrm:attendance:holiday:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #type="{ row }">
        <DictTag
          :type="DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE"
          :value="row.type"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['hrm:attendance:holiday:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:attendance:holiday:delete'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
