<script lang="ts" setup>
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Spin,
  Table,
} from 'antdv-next';

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
    <Spin :spinning="loading">
      <Descriptions v-if="detailData" :column="2" bordered size="small">
        <DescriptionsItem label="班次">
          {{ detailData.shiftName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="考勤结果">
          {{ detailData.attendanceResult || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="应打卡次数">
          {{ detailData.requiredClockCount || 0 }}
        </DescriptionsItem>
        <DescriptionsItem label="实际打卡次数">
          {{ detailData.clockList?.length || 0 }}
        </DescriptionsItem>
      </Descriptions>

      <Table
        :columns="[
          {
            title: '打卡类型',
            dataIndex: 'type',
            width: 110,
          },
          {
            title: '应打卡时间',
            dataIndex: 'attendanceTime',
            width: 170,
          },
          {
            title: '打卡时间',
            dataIndex: 'clockTime',
            width: 170,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 90,
          },
          {
            title: '地点',
            dataIndex: 'address',
            ellipsis: true,
          },
        ]"
        :data-source="detailData?.clockList || []"
        :pagination="false"
        :row-key="(row) => row.id || `${row.type}-${row.clockTime}`"
        class="mt-4"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'type'">
            <DictTag
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
              :value="record.type"
            />
          </template>
          <template v-else-if="column.dataIndex === 'attendanceTime'">
            {{ formatHrmDateTime(record.attendanceTime) }}
          </template>
          <template v-else-if="column.dataIndex === 'clockTime'">
            {{ formatHrmDateTime(record.clockTime) }}
          </template>
          <template v-else-if="column.dataIndex === 'status'">
            <DictTag
              :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
              :value="record.status"
            />
          </template>
        </template>
      </Table>
    </Spin>

    <template #footer>
      <Button @click="modalApi.close()">关闭</Button>
    </template>
  </Modal>
</template>
