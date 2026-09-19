<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaMeetingRoomApi } from '#/api/oa/meetingroom/room';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMeetingRoom,
  getMeetingRoomPage,
} from '#/api/oa/meetingroom/room';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import ScheduleDialog from './components/schedule-dialog.vue';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaMeetingRoom' });

const scheduleDialogRef = ref<InstanceType<typeof ScheduleDialog>>(); // 预定信息弹窗

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建会议室 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑会议室 */
function handleEdit(row: OaMeetingRoomApi.MeetingRoom) {
  formModalApi.setData(row).open();
}

/** 查看会议室预定信息 */
function handleSchedule(row: OaMeetingRoomApi.MeetingRoom) {
  scheduleDialogRef.value?.open(row.id!, row.name!);
}

/** 删除会议室 */
async function handleDelete(row: OaMeetingRoomApi.MeetingRoom) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteMeetingRoom(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMeetingRoomPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  } as VxeTableGridOptions<OaMeetingRoomApi.MeetingRoom>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <ScheduleDialog ref="scheduleDialogRef" />

    <Grid table-title="会议室列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['会议室']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:meeting-room:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #equipments="{ row }">
        <DictTag
          v-for="item in row.equipments || []"
          :key="item"
          class="mr-1"
          :type="DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT"
          :value="item"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '预定信息',
              type: 'link',
              auth: ['oa:meeting-room:query', 'oa:meeting-room-booking:query'],
              onClick: handleSchedule.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:meeting-room:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:meeting-room:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
