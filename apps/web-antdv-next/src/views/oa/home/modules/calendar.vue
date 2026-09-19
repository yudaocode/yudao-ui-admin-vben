<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { formatDate } from '@vben/utils';

import { Button, Calendar, Empty, Spin } from 'antdv-next';
import dayjs from 'dayjs';

import { getMySchedulePage } from '#/api/oa/schedule';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomeCalendar' });

type Schedule = Awaited<ReturnType<typeof getMySchedulePage>>['list'][number];

const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const { push } = useRouter();
const schedules = ref<Schedule[]>([]); // 当前月份日程
const selectedDate = ref<Dayjs>(dayjs()); // 当前选中日期
const selectedDateKey = computed(() => selectedDate.value.format('YYYY-MM-DD')); // 选中日期标识
const selectedDateTitle = computed(() =>
  selectedDate.value.format('MM 月 DD 日日程'),
); // 选中日期标题
const selectedSchedules = computed(() =>
  schedules.value.filter(
    (item) => dayjs(item.startTime).format('YYYY-MM-DD') === selectedDateKey.value,
  ),
); // 选中日期的日程列表

/** 判断日期是否存在日程 */
function hasSchedule(date: Dayjs) {
  const dateKey = date.format('YYYY-MM-DD');
  return schedules.value.some(
    (item) => dayjs(item.startTime).format('YYYY-MM-DD') === dateKey,
  );
}

/** 查询选中月份的全部日程，避免只展示第一页 */
async function getList() {
  loading.value = true;
  loadError.value = false;
  try {
    const queryParams = {
      pageNo: 1,
      pageSize: 200,
      startTime: [
        selectedDate.value.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        selectedDate.value.endOf('month').format('YYYY-MM-DD HH:mm:ss'),
      ],
    };
    const list: Schedule[] = [];
    let total = 0;
    do {
      const data = await getMySchedulePage(queryParams);
      list.push(...data.list);
      total = data.total;
      queryParams.pageNo++;
      if (data.list.length === 0) {
        break;
      }
    } while (list.length < total);
    schedules.value = list;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => selectedDate.value.format('YYYY-MM'),
  () => {
    getList();
  },
);

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <OaHomePanel title="行事历">
    <template #actions>
      <Button type="link" @click="push('/oa/schedule/calendar')">
        日程管理
      </Button>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <Button type="link" @click="getList">重新加载</Button>
    </div>
    <Spin :spinning="loading">
      <Calendar
        v-model:value="selectedDate"
        class="home-calendar"
        :fullscreen="false"
      >
        <template #headerRender>
          <strong>{{ selectedDate.format('YYYY 年 MM 月') }}</strong>
        </template>
        <template #dateFullCellRender="{ date }">
          <div class="relative flex h-full items-center justify-center">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full"
              :class="{
                'bg-primary text-primary-foreground': date.isSame(
                  dayjs(),
                  'day',
                ),
              }"
            >
              {{ date.format('D') }}
            </span>
            <i
              v-if="hasSchedule(date as Dayjs)"
              class="bg-primary absolute bottom-[2px] right-[3px] h-[5px] w-[5px] rounded-full"
            ></i>
          </div>
        </template>
      </Calendar>

      <!-- 选中日期的日程 -->
      <div class="border-border min-h-[90px] border-t pt-3">
        <div class="mb-2 text-[13px] font-semibold">{{ selectedDateTitle }}</div>
        <Empty
          v-if="selectedSchedules.length === 0"
          :image-style="{ height: '48px' }"
          description="暂无日程"
        />
        <div
          v-for="item in selectedSchedules"
          v-else
          :key="item.id"
          class="flex min-h-[30px] items-center gap-2.5"
        >
          <span class="text-primary text-xs">
            {{
              dayjs(item.startTime).isSame(selectedDate, 'day')
                ? formatDate(item.startTime, 'HH:mm')
                : '持续'
            }}
          </span>
          <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
        </div>
      </div>
    </Spin>
  </OaHomePanel>
</template>

<style lang="scss" scoped>
.home-calendar {
  :deep(.ant-picker-panel) {
    border-top: none;
  }

  :deep(.ant-picker-content) {
    th {
      padding: 6px 0;
    }
  }

  :deep(.ant-picker-calendar-date) {
    height: 34px;
    padding: 2px;
    margin: 0;
    border-top: none;
  }
}
</style>
