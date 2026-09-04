<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { prompt, useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelMyAttendanceLeave,
  getMyAttendanceLeaveList,
} from '#/api/hrm/portal/attendance/leave';

import { useLeaveGridColumns } from '../data';
import AttendanceLeaveForm from './attendance-leave-form.vue';

defineOptions({ name: 'HrmPortalAttendanceLeaveList' });

const emit = defineEmits<{ changed: [] }>();
const router = useRouter();
const { hasAccessByCodes } = useAccess();

const [LeaveFormModal, leaveFormModalApi] = useVbenModal({
  connectedComponent: AttendanceLeaveForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useLeaveGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmAttendanceLeaveApi.AttendanceLeave>,
});

/** 获得我的请假申请列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    await gridApi.grid.reloadData((await getMyAttendanceLeaveList()) || []);
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开请假申请表单 */
function openCreate() {
  leaveFormModalApi.open();
}

/** 取消请假申请 */
async function handleCancel(id?: number) {
  if (!id) return;
  let result;
  try {
    result = await prompt({
      content: '请输入取消原因',
      title: '取消请假申请',
    });
  } catch {
    return;
  }
  const reason = result?.trim();
  if (!reason) {
    message.warning('请输入取消原因');
    return;
  }
  await cancelMyAttendanceLeave(id, reason);
  message.success('请假申请已取消');
  await getList();
  emit('changed');
}

/** 打开流程详情 */
function openProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) return;
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: processInstanceId },
  });
}

defineExpose({ refresh: getList, openCreate });

getList();
</script>

<template>
  <div>
    <div class="mb-3 mt-6 text-base font-semibold">我的请假申请</div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '审批进度',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              ifShow: !!row.processInstanceId,
              onClick: openProcessDetail.bind(null, row.processInstanceId),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow:
                row.approvalStatus === BpmProcessInstanceStatus.RUNNING &&
                hasAccessByCodes(['hrm:portal:attendance:leave']),
              onClick: handleCancel.bind(null, row.id),
            },
          ]"
        />
      </template>
    </Grid>
    <LeaveFormModal
      @success="
        getList();
        emit('changed');
      "
    />
  </div>
</template>
