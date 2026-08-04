<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceClockApi } from '#/api/hrm/attendance/clock';

import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAttendanceClock,
  deleteAttendanceClockList,
  exportAttendanceClock,
  getAttendanceClockPage,
} from '#/api/hrm/attendance/clock';
import { $t } from '#/locales';
import { HrmAttendanceClockSource } from '#/views/hrm/utils/constants';

import {
  buildRecordQueryParams,
  useRecordGridColumns,
  useRecordGridFormSchema,
} from '../data';
import Form from './form.vue';

defineOptions({ name: 'HrmAttendanceClockRecordList' });

const checkedIds = ref<number[]>([]);
const exportLoading = ref(false);
const batchDeleteLoading = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function isManualClock(row: HrmAttendanceClockApi.AttendanceClock) {
  return row.sourceType === HrmAttendanceClockSource.MANUAL;
}

function handleRefresh() {
  checkedIds.value = [];
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(row: HrmAttendanceClockApi.AttendanceClock) {
  formModalApi.setData({ id: row.id, type: 'update' }).open();
}

async function handleDelete(id?: number) {
  if (!id) {
    return;
  }
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteAttendanceClock(id);
    message.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } catch {}
}

async function handleBatchDelete() {
  if (checkedIds.value.length === 0) {
    return;
  }
  try {
    await confirm(
      `确定删除选中的 ${checkedIds.value.length} 条打卡记录吗？删除后会立即影响日/月考勤统计。`,
    );
    batchDeleteLoading.value = true;
    await deleteAttendanceClockList(checkedIds.value);
    message.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } catch {
  } finally {
    batchDeleteLoading.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    await confirm({
      content: '确认导出当前筛选条件下的打卡记录吗？',
      title: '导出确认',
    });
    const formValues = await gridApi.formApi.getValues();
    const data = await exportAttendanceClock({
      pageNo: 1,
      pageSize: 100,
      ...buildRecordQueryParams(formValues),
    } as PageParam);
    downloadFileFromBlobPart({ fileName: '打卡记录.xls', source: data });
  } catch {
  } finally {
    exportLoading.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useRecordGridFormSchema(),
  },
  gridEvents: {
    checkboxAll: ({
      records,
    }: {
      records: HrmAttendanceClockApi.AttendanceClock[];
    }) => {
      checkedIds.value = records
        .filter((row: HrmAttendanceClockApi.AttendanceClock) =>
          isManualClock(row),
        )
        .map((row: HrmAttendanceClockApi.AttendanceClock) => row.id!)
        .filter(Boolean);
    },
    checkboxChange: ({
      records,
    }: {
      records: HrmAttendanceClockApi.AttendanceClock[];
    }) => {
      checkedIds.value = records
        .filter((row: HrmAttendanceClockApi.AttendanceClock) =>
          isManualClock(row),
        )
        .map((row: HrmAttendanceClockApi.AttendanceClock) => row.id!)
        .filter(Boolean);
    },
  },
  gridOptions: {
    checkboxConfig: {
      checkMethod: ({ row }: { row: HrmAttendanceClockApi.AttendanceClock }) =>
        isManualClock(row),
      highlight: true,
      reserve: true,
    },
    columns: useRecordGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAttendanceClockPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...buildRecordQueryParams(formValues),
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<HrmAttendanceClockApi.AttendanceClock>,
});
</script>

<template>
  <div class="h-full pt-2">
    <FormModal @success="handleRefresh" />

    <Grid class="h-full" table-title="打卡明细">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:attendance:clock:create'],
              onClick: handleCreate,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:attendance:clock:delete'],
              disabled: checkedIds.length === 0,
              loading: batchDeleteLoading,
              onClick: handleBatchDelete,
            },
            {
              label: '导出',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['hrm:attendance:clock:export'],
              loading: exportLoading,
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:attendance:clock:update'],
              disabled: !isManualClock(row),
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:attendance:clock:delete'],
              disabled: !isManualClock(row),
              onClick: handleDelete.bind(null, row.id),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
