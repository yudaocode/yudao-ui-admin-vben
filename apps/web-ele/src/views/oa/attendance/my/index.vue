<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaAttendanceApi } from '#/api/oa/attendance';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import { ElButton, ElCard, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  clockAttendance,
  getMyAttendancePage,
  getMyTodayAttendanceList,
} from '#/api/oa/attendance';
import { OA_ATTENDANCE_TYPE } from '#/views/oa/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'OaAttendanceMy' });

const clockLoading = ref(false); // 打卡的加载中
const todayAttendanceList = ref<OaAttendanceApi.Attendance[]>([]); // 今日考勤记录

/** 获得打卡按钮文案 */
const clockButtonText = computed(() => {
  if (
    !todayAttendanceList.value.some(
      (item) => item.type === OA_ATTENDANCE_TYPE.CLOCK_IN,
    )
  ) {
    return '上班打卡';
  }
  return todayAttendanceList.value.some(
    (item) => item.type === OA_ATTENDANCE_TYPE.CLOCK_OUT,
  )
    ? '更新下班打卡'
    : '下班打卡';
});

/** 查询今日考勤 */
async function getTodayList() {
  todayAttendanceList.value = await getMyTodayAttendanceList();
}

/** 执行打卡 */
async function handleClock() {
  clockLoading.value = true;
  try {
    // 发起打卡
    await clockAttendance();
    ElMessage.success('打卡成功');
    // 刷新今日考勤和考勤记录
    await Promise.all([getTodayList(), gridApi.query()]);
  } finally {
    clockLoading.value = false;
  }
}

/** 获得指定类型的今日打卡文案 */
function getClockText(type: number) {
  const attendance = todayAttendanceList.value.find(
    (item) => item.type === type,
  );
  if (!attendance) {
    return '未打卡';
  }
  return `${formatDate(attendance.attendanceTime, 'HH:mm:ss')}（${getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, attendance.status)}）`;
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
          return await getMyAttendancePage({
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
  } as VxeTableGridOptions<OaAttendanceApi.Attendance>,
});

/** 初始化 */
onMounted(() => {
  getTodayList();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-4">
      <!-- 今日打卡 -->
      <ElCard class="shrink-0">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="text-lg font-semibold">今日考勤</div>
            <div class="mt-2 text-sm text-muted-foreground">
              <span>
                上班：{{ getClockText(OA_ATTENDANCE_TYPE.CLOCK_IN) }}
              </span>
              <span class="ml-4">
                下班：{{ getClockText(OA_ATTENDANCE_TYPE.CLOCK_OUT) }}
              </span>
            </div>
          </div>
          <ElButton
            type="primary"
            :loading="clockLoading"
            @click="handleClock"
          >
            {{ clockButtonText }}
          </ElButton>
        </div>
      </ElCard>

      <!-- 我的考勤记录 -->
      <div class="min-h-0 flex-1">
        <Grid table-title="考勤记录" />
      </div>
    </div>
  </Page>
</template>
