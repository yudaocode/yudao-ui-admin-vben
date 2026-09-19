<script lang="ts" setup>
import type { OaMeetingRoomBookingApi } from '#/api/oa/meetingroom/booking';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { formatDate } from '@vben/utils';

import { ElDialog, ElEmpty, ElTooltip } from 'element-plus';

import { getMeetingRoomBookingSchedule } from '#/api/oa/meetingroom/booking';
import { DictTag } from '#/components/dict-tag';
import { OA_WEEKDAY_NAMES } from '#/views/oa/utils/constants';

defineOptions({ name: 'OaMeetingRoomScheduleDialog' });

withDefaults(defineProps<{ showBookings?: boolean }>(), {
  showBookings: true,
});

const open = ref(false); // 弹窗是否打开
const dialogTitle = ref(''); // 弹窗标题
const loading = ref(false); // 日程加载中
const list = ref<OaMeetingRoomBookingApi.MeetingRoomBooking[]>([]); // 五天内的有效预定
const dates = ref<number[]>([]); // 日期选项
const selectedDate = ref(0); // 当前日期零点

/** 当前日期的预定，包含跨日会议 */
const dayBookings = computed(() => {
  const endTime = selectedDate.value + 24 * 60 * 60 * 1000;
  return list.value.filter(
    (booking) =>
      Number(booking.startTime) < endTime &&
      Number(booking.endTime) > selectedDate.value,
  );
});

/** 生成半小时占用格，审批中的预定也占用时段 */
const slots = computed(() => {
  return Array.from({ length: 48 }, (_, index) => {
    const startTime = selectedDate.value + index * 30 * 60 * 1000;
    const endTime = startTime + 30 * 60 * 1000;
    const booking = dayBookings.value.find(
      (item) =>
        Number(item.startTime) < endTime && Number(item.endTime) > startTime,
    );
    const expired = endTime <= Date.now();
    const title =
      formatDate(startTime, 'HH:mm') +
      '-' +
      formatDate(endTime, 'HH:mm') +
      ' - ' +
      (expired
        ? '已过期'
        : booking
          ? booking.title + '（' + booking.moderatorName + '）'
          : '可预约');
    return { startTime, booking, expired, title };
  });
});

/** 打开预定信息 */
async function openModal(roomId: number, roomName: string) {
  // 1. 打开弹窗，初始化最近五天及当前选中日期
  open.value = true;
  dialogTitle.value = roomName + ' - 预约信息';
  const startTime = new Date();
  startTime.setHours(0, 0, 0, 0);
  dates.value = Array.from(
    { length: 5 },
    (_, index) => startTime.getTime() + index * 24 * 60 * 60 * 1000,
  );
  selectedDate.value = dates.value[0]!;
  list.value = [];
  // 2. 查询五天内的有效预定，供时段占用和当日列表展示
  loading.value = true;
  try {
    list.value = await getMeetingRoomBookingSchedule(
      roomId,
      formatDate(startTime, 'YYYY-MM-DD HH:mm:ss'),
      formatDate(
        startTime.getTime() + 5 * 24 * 60 * 60 * 1000,
        'YYYY-MM-DD HH:mm:ss',
      ),
    );
  } finally {
    loading.value = false;
  }
}

defineExpose({ open: openModal }); // 提供 open 方法，用于打开弹窗
</script>

<template>
  <ElDialog v-model="open" :title="dialogTitle" width="1150px">
    <div v-loading="loading">
      <!-- 最近五天 -->
      <div class="border-border mb-5 flex gap-2 border-0 border-b border-solid pb-3">
        <button
          v-for="date in dates"
          :key="date"
          type="button"
          class="cursor-pointer rounded border-0 px-5 py-2 text-center"
          :class="selectedDate === date ? 'bg-primary text-white' : 'bg-accent'"
          @click="selectedDate = date"
        >
          <div>{{ formatDate(date, 'MM-DD') }}</div>
          <div class="mt-1 text-xs">{{ OA_WEEKDAY_NAMES[new Date(date).getDay()] }}</div>
        </button>
      </div>
      <div class="flex gap-5">
        <!-- 半小时占用格 -->
        <div class="min-w-0 flex-1">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div class="text-base font-semibold">
              {{ formatDate(selectedDate, 'YYYY年MM月DD日') }} 预约情况
            </div>
            <!-- 预约状态说明 -->
            <div class="flex shrink-0 items-center gap-4 text-[13px]">
              <span class="flex items-center gap-1.5">
                <i class="h-3.5 w-3.5 border border-solid border-gray-300 bg-white"></i>
                可预约
              </span>
              <span class="flex items-center gap-1.5">
                <i class="h-3.5 w-3.5 bg-green-500"></i>
                已预约
              </span>
              <span class="flex items-center gap-1.5">
                <i class="h-3.5 w-3.5 bg-gray-200"></i>
                已过期
              </span>
            </div>
          </div>
          <div class="border-border overflow-hidden rounded-lg border border-solid">
            <div
              v-for="period in [0, 1]"
              :key="period"
              class="flex"
              :class="period === 1 ? 'border-border border-0 border-t border-solid' : ''"
            >
              <div
                class="border-border bg-muted flex w-14 shrink-0 items-center justify-center border-0 border-r border-solid font-semibold"
              >
                {{ period === 0 ? '上午' : '下午' }}
              </div>
              <div class="min-w-0 flex-1">
                <!-- 整点时间表头 -->
                <div
                  class="border-border bg-accent text-muted-foreground grid grid-cols-12 border-0 border-b border-solid px-1.5 py-2.5 text-center text-xs font-semibold"
                >
                  <span v-for="hour in 12" :key="hour">
                    {{ String(period * 12 + hour - 1).padStart(2, '0') }}:00
                  </span>
                </div>
                <!-- 每格表示半小时 -->
                <div class="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5 px-1.5 py-2.5">
                  <ElTooltip
                    v-for="slot in slots.slice(period * 24, (period + 1) * 24)"
                    :key="slot.startTime"
                    :content="slot.title"
                    placement="top"
                  >
                    <div
                      class="border-border h-9 rounded border border-solid"
                      :class="
                        slot.expired ? 'bg-gray-200' : slot.booking ? 'bg-green-500' : 'bg-white'
                      "
                    ></div>
                  </ElTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 当日预定信息 -->
        <div
          v-if="showBookings"
          class="border-border w-72 shrink-0 border-0 border-l border-solid pl-4"
        >
          <div class="mb-3 text-base font-semibold">
            {{ formatDate(selectedDate, 'MM 月 DD 日') }}已预约
          </div>
          <ElEmpty
            v-if="!dayBookings.length"
            description="暂无预约记录"
            :image-size="70"
          />
          <div class="max-h-[400px] space-y-3 overflow-y-auto">
            <div
              v-for="booking in dayBookings"
              :key="booking.id"
              class="border-border rounded border border-solid p-3"
            >
              <div class="mb-2 flex items-start justify-between gap-2">
                <div class="text-primary min-w-0 break-words font-medium">
                  {{ booking.title }}
                </div>
                <DictTag
                  v-if="booking.status !== undefined"
                  class="shrink-0"
                  :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                  :value="booking.status"
                />
              </div>
              <div class="mb-2">
                {{ formatDate(booking.startTime, 'HH:mm') }} -
                {{ formatDate(booking.endTime, 'HH:mm') }}
              </div>
              <div class="text-muted-foreground text-xs">
                主持人：{{ booking.moderatorName }}
                <span class="ml-3">申请人：{{ booking.creatorName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ElDialog>
</template>
