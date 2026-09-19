<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaMeetingRoomBookingApi } from '#/api/oa/meetingroom/booking';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMeetingRoomBooking,
  deleteMeetingRoomBooking,
  finishMeetingRoomBooking,
  getMeetingRoomBookingPage,
  startMeetingRoomBooking,
  submitMeetingRoomBooking,
} from '#/api/oa/meetingroom/booking';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { OaMeetingRoomUseStatus } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaMeetingRoomBooking' });

const router = useRouter(); // 路由

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建会议室预定 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑会议室预定 */
function handleEdit(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  formModalApi.setData(row).open();
}

/** 查看会议室预定详情 */
function handleDetail(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 查看审批进度 */
function handleProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) {
    return;
  }
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: processInstanceId },
  });
}

/** 提交预定 */
async function handleSubmit(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  await submitMeetingRoomBooking(row.id!);
  message.success('提交成功');
  handleRefresh();
}

/** 取消预定 */
async function handleCancel(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  await cancelMeetingRoomBooking(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 开始使用预定 */
async function handleStart(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  await startMeetingRoomBooking(row.id!);
  message.success('开始使用成功');
  handleRefresh();
}

/** 完成使用预定 */
async function handleFinish(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  await finishMeetingRoomBooking(row.id!);
  message.success('完成使用成功');
  handleRefresh();
}

/** 删除会议室预定 */
async function handleDelete(row: OaMeetingRoomBookingApi.MeetingRoomBooking) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteMeetingRoomBooking(row.id!);
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
          return await getMeetingRoomBookingPage({
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
  } as VxeTableGridOptions<OaMeetingRoomBookingApi.MeetingRoomBooking>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal />

    <Grid table-title="会议室预定列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['会议室预定']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:meeting-room-booking:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #no="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.no }}
        </span>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </Tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="row.status"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: handleProcessDetail.bind(null, row.processInstanceId),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:meeting-room-booking:update'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '提交',
              type: 'link',
              auth: ['oa:meeting-room-booking:create'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: '确定提交这条会议室预定吗？',
                confirm: handleSubmit.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:meeting-room-booking:delete'],
              ifShow: row.status === BpmProcessInstanceStatus.NOT_START,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '开始',
              type: 'link',
              auth: ['oa:meeting-room-booking:update'],
              ifShow:
                row.status === BpmProcessInstanceStatus.APPROVE &&
                row.useStatus === OaMeetingRoomUseStatus.PENDING,
              popConfirm: {
                title: '确定开始使用这条会议室预定吗？',
                confirm: handleStart.bind(null, row),
              },
            },
            {
              label: '完成',
              type: 'link',
              auth: ['oa:meeting-room-booking:update'],
              ifShow:
                row.status === BpmProcessInstanceStatus.APPROVE &&
                row.useStatus === OaMeetingRoomUseStatus.IN_USE,
              popConfirm: {
                title: '确定完成使用这条会议室预定吗？',
                confirm: handleFinish.bind(null, row),
              },
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['oa:meeting-room-booking:update'],
              ifShow:
                row.status === BpmProcessInstanceStatus.RUNNING ||
                (row.status === BpmProcessInstanceStatus.APPROVE &&
                  row.useStatus === OaMeetingRoomUseStatus.PENDING),
              popConfirm: {
                title: '确定取消这条会议室预定吗？',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
