<script lang="ts" setup>
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { ref, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import { Descriptions, Spin } from 'ant-design-vue';

import { getAttendanceLeave } from '#/api/hrm/attendance/leave';
import { DictTag } from '#/components/dict-tag';

defineOptions({ name: 'HrmAttendanceLeaveProcessDetail' });

const props = defineProps<{ id: string }>();

const loading = ref(false);
const leave = ref<HrmAttendanceLeaveApi.AttendanceLeave>();

async function loadLeave() {
  const id = Number(props.id);
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    leave.value = await getAttendanceLeave(id);
  } finally {
    loading.value = false;
  }
}

watch(() => props.id, loadLeave, { immediate: true });
</script>

<template>
  <Spin :spinning="loading">
    <div class="min-h-[220px] py-1 pb-5">
      <div class="mb-3 text-base font-semibold">员工请假申请</div>
      <Descriptions v-if="leave" :column="2" bordered size="small">
        <Descriptions.Item label="员工姓名">
          {{ leave.employeeName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="请假类型">
          <DictTag
            :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
            :value="leave.type"
          />
        </Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {{ formatDate(leave.startTime) || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="结束时间">
          {{ formatDate(leave.endTime) || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="请假天数">
          {{ leave.day }} 天
        </Descriptions.Item>
        <Descriptions.Item label="审批状态">
          <DictTag
            v-if="leave.approvalStatus !== undefined"
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="leave.approvalStatus"
          />
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item label="请假事由" :span="2">
          {{ leave.reason || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="备注" :span="2">
          {{ leave.remark || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Spin>
</template>
