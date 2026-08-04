<script lang="ts" setup>
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { prompt } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

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
      ElMessage.warning('请输入取消原因');
      return;
    }
    await cancelMyAttendanceLeave(id, reason);
    ElMessage.success('请假申请已取消');
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
    <ElTable v-loading="loading" border :data="list" row-key="id" size="small">
      <ElTableColumn align="center" label="请假类型" prop="type" width="110">
        <template #default="{ row }">
          <DictTag
            :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
            :value="row.type"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn
        align="center"
        label="开始时间"
        prop="startTime"
        width="170"
      >
        <template #default="{ row }">
          {{ formatDate(row.startTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="结束时间" prop="endTime" width="170">
        <template #default="{ row }">
          {{ formatDate(row.endTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="请假天数" prop="day" width="100">
        <template #default="{ row }">{{ row.day }} 天</template>
      </ElTableColumn>
      <ElTableColumn
        label="请假事由"
        min-width="160"
        prop="reason"
        show-overflow-tooltip
      />
      <ElTableColumn
        align="center"
        label="审批状态"
        prop="approvalStatus"
        width="110"
      >
        <template #default="{ row }">
          <DictTag
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="row.approvalStatus"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <ElButton
            v-if="row.processInstanceId"
            link
            type="primary"
            @click="openProcessDetail(row.processInstanceId)"
          >
            审批进度
          </ElButton>
          <ElButton
            v-if="
              row.approvalStatus === BpmProcessInstanceStatus.RUNNING &&
              hasAccessByCodes(['hrm:portal:attendance:leave'])
            "
            link
            type="danger"
            @click="handleCancel(row.id)"
          >
            取消
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <AttendanceLeaveForm
      ref="formRef"
      @success="
        getList();
        emit('changed');
      "
    />
  </div>
</template>
