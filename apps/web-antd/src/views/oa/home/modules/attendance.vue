<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { Button, message, Spin } from 'ant-design-vue';

import { clockAttendance, getMyTodayAttendanceList } from '#/api/oa/attendance';

defineOptions({ name: 'OaHomeAttendance' });

type Attendance = Awaited<
  ReturnType<typeof getMyTodayAttendanceList>
>[number];

const { push } = useRouter(); // 路由跳转
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const clockLoading = ref(false); // 打卡提交中
const attendance = ref<Attendance>(); // 今日最近打卡
const attendanceText = computed(() => {
  if (!attendance.value?.type) {
    return '未打卡';
  }
  return getDictLabel(DICT_TYPE.OA_ATTENDANCE_TYPE, attendance.value.type);
}); // 今日最近打卡类型
const attendanceDescription = computed(() => {
  if (!attendance.value?.attendanceTime) {
    return '今天还没有考勤记录';
  }
  const status = getDictLabel(
    DICT_TYPE.OA_ATTENDANCE_STATUS,
    attendance.value.status,
  );
  return `${formatDate(attendance.value.attendanceTime, 'HH:mm:ss')} · ${status}`;
}); // 今日最近打卡说明

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    attendance.value = (await getMyTodayAttendanceList()).slice(-1)[0];
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 打卡后只刷新考勤卡片 */
async function handleClock() {
  if (clockLoading.value) return;
  clockLoading.value = true;
  try {
    await clockAttendance();
    message.success('打卡成功');
    await getList();
  } finally {
    clockLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <Spin
    :spinning="loading"
    wrapper-class-name="h-full [&>.ant-spin-container]:h-full"
  >
    <div
      class="relative flex h-full min-h-[116px] cursor-pointer items-center gap-4 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#409eff,#66b1ff)] p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5"
      @click="push('/oa/attendance/my')"
    >
      <!-- 打卡入口随标题布局，避免绝对定位与说明文字重叠 -->
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex flex-wrap items-center gap-x-3 text-sm">
          <span class="opacity-90">今日考勤</span>
          <Button
            class="!text-xs !text-white"
            :loading="clockLoading"
            type="link"
            @click.stop="handleClock"
          >
            立即打卡
          </Button>
        </div>
        <div
          v-if="loadError"
          class="mt-1 truncate text-xs opacity-85"
          @click.stop="getList"
        >
          加载失败，点击重试
        </div>
        <div v-else class="truncate text-[28px] font-semibold">
          {{ attendanceText }}
        </div>
        <div class="mt-1 truncate text-xs opacity-85">
          {{ attendanceDescription }}
        </div>
      </div>
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
      >
        <IconifyIcon icon="ep:calendar" class="text-[30px]" />
      </div>
    </div>
  </Spin>
</template>
