<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getAttendanceDailyDetail } from '#/api/hrm/attendance/statistics';
import { DictTag } from '#/components/dict-tag';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmAttendanceClockDailyDetail' });

const loading = ref(false);
const detailData = ref<HrmAttendanceStatisticsApi.DailyDetail>();

const dialogTitle = computed(() => {
  if (!detailData.value) {
    return '每日考勤详情';
  }
  return `${detailData.value.employeeName || ''} ${formatDate(
    detailData.value.attendanceTime,
    'YYYY-MM-DD',
  )}`;
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detailData.value = undefined;
    }
  },
});

async function open(employeeId: number, attendanceDate: string) {
  modalApi.setState({ title: '每日考勤详情' });
  modalApi.open();
  loading.value = true;
  detailData.value = undefined;
  try {
    detailData.value = await getAttendanceDailyDetail({
      employeeId,
      attendanceTime: formatDate(attendanceDate),
    });
    modalApi.setState({ title: dialogTitle.value });
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal :title="dialogTitle" class="w-[820px]">
    <div v-loading="loading">
      <ElDescriptions v-if="detailData" :column="2" border size="small">
        <ElDescriptionsItem label="班次">
          {{ detailData.shiftName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="考勤结果">
          {{ detailData.attendanceResult || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="应打卡次数">
          {{ detailData.requiredClockCount || 0 }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="实际打卡次数">
          {{ detailData.clockList?.length || 0 }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElTable
        :data="detailData?.clockList || []"
        :row-key="(row) => String(row.id || `${row.type}-${row.clockTime}`)"
        class="mt-4"
        size="small"
      >
        <ElTableColumn label="打卡类型" prop="type" width="110">
          <template #default="{ row }">
            <DictTag
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
              :value="row.type"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="应打卡时间" prop="attendanceTime" width="170">
          <template #default="{ row }">
            {{ formatHrmDateTime(row.attendanceTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="打卡时间" prop="clockTime" width="170">
          <template #default="{ row }">
            {{ formatHrmDateTime(row.clockTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" prop="status" width="90">
          <template #default="{ row }">
            <DictTag
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
              :value="row.status"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn
          label="地点"
          min-width="140"
          prop="address"
          show-overflow-tooltip
        />
      </ElTable>
    </div>

    <template #footer>
      <ElButton @click="modalApi.close()">关闭</ElButton>
    </template>
  </Modal>
</template>
