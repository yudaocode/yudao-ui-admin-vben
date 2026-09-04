<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceClockApi } from '#/api/hrm/attendance/clock';
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAttendanceDailyDetail } from '#/api/hrm/attendance/statistics';

import { useDailyDetailGridColumns } from '../data';

defineOptions({ name: 'HrmAttendanceClockDailyDetail' });

const detailData = ref<HrmAttendanceStatisticsApi.DailyDetail>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useDailyDetailGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmAttendanceClockApi.AttendanceClock>,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    const { attendanceDate, employeeId } = modalApi.getData() as {
      attendanceDate: string;
      employeeId: number;
    };
    modalApi.setState({ title: '每日考勤详情' });
    modalApi.lock();
    try {
      detailData.value = await getAttendanceDailyDetail({
        employeeId,
        attendanceTime: formatDate(attendanceDate, 'YYYY-MM-DD HH:mm:ss'),
      });
      modalApi.setState({
        title: `${detailData.value.employeeName || ''} ${formatDate(
          detailData.value.attendanceTime,
          'YYYY-MM-DD',
        )}`,
      });
      await nextTick();
      await gridApi.grid.reloadData(detailData.value.clockList || []);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[820px]">
    <ElDescriptions
      v-if="detailData"
      :column="2"
      border
      class="mb-4"
      size="small"
    >
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
    <Grid class="w-full" />
  </Modal>
</template>
