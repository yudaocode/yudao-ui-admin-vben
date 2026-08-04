<script lang="ts" setup>
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { prompt } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import { Button, message, Table } from 'antdv-next';

import {
  cancelMyAttendanceLeave,
  getMyAttendanceLeaveList,
} from '#/api/hrm/portal/attendance/leave';
import { DictTag } from '#/components/dict-tag';

import AttendanceLeaveForm from '../leave/AttendanceLeaveForm.vue';

defineOptions({ name: 'HrmPortalAttendanceLeaveList' });

const emit = defineEmits<{
  changed: [];
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const list = ref<HrmAttendanceLeaveApi.AttendanceLeave[]>([]);
const formRef = ref<InstanceType<typeof AttendanceLeaveForm>>();

const columns = [
  {
    title: '请假类型',
    dataIndex: 'type',
    key: 'type',
    width: 110,
    align: 'center' as const,
  },
  {
    title: '开始时间',
    dataIndex: 'startTime',
    key: 'startTime',
    width: 170,
    align: 'center' as const,
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    key: 'endTime',
    width: 170,
    align: 'center' as const,
  },
  {
    title: '请假天数',
    dataIndex: 'day',
    key: 'day',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '请假事由',
    dataIndex: 'reason',
    key: 'reason',
    minWidth: 160,
    ellipsis: true,
  },
  {
    title: '审批状态',
    dataIndex: 'approvalStatus',
    key: 'approvalStatus',
    width: 110,
    align: 'center' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

/** 获得我的请假申请列表 */
async function getList() {
  loading.value = true;
  try {
    list.value = await getMyAttendanceLeaveList();
  } finally {
    loading.value = false;
  }
}

/** 打开请假申请表单 */
function openCreate() {
  formRef.value?.open();
}

/** 取消请假申请 */
async function handleCancel(id?: number) {
  if (!id) {
    return;
  }
  try {
    const result = await prompt({
      content: '请输入取消原因',
      title: '取消请假申请',
    });
    const reason = result?.trim();
    if (!reason) {
      message.warning('请输入取消原因');
      return;
    }
    await cancelMyAttendanceLeave(id, reason);
    message.success('请假申请已取消');
    await getList();
    emit('changed');
  } catch {
    // 用户取消
  }
}

/** 打开流程详情 */
function openProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) {
    return;
  }
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
    <Table
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 900 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <DictTag
            :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
            :value="record.type"
          />
        </template>
        <template v-else-if="column.key === 'startTime'">
          {{ formatDate(record.startTime) }}
        </template>
        <template v-else-if="column.key === 'endTime'">
          {{ formatDate(record.endTime) }}
        </template>
        <template v-else-if="column.key === 'day'">
          {{ record.day }} 天
        </template>
        <template v-else-if="column.key === 'approvalStatus'">
          <DictTag
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="record.approvalStatus"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            v-if="record.processInstanceId"
            type="link"
            @click="openProcessDetail(record.processInstanceId)"
          >
            审批进度
          </Button>
          <Button
            v-if="
              record.approvalStatus === BpmProcessInstanceStatus.RUNNING &&
              hasAccessByCodes(['hrm:portal:attendance:leave'])
            "
            danger
            type="link"
            @click="handleCancel(record.id)"
          >
            取消
          </Button>
        </template>
      </template>
    </Table>

    <AttendanceLeaveForm
      ref="formRef"
      @success="
        getList();
        emit('changed');
      "
    />
  </div>
</template>
