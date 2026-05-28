<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { IotStatisticsApi } from '#/api/iot/statistics';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import dayjs from 'dayjs';
import { ElCard, ElEmpty, ElOption, ElSelect } from 'element-plus';

import { getDeviceMessageSummaryByDate } from '#/api/iot/statistics';
import ShortcutDateRangePicker from '#/components/shortcut-date-range-picker/shortcut-date-range-picker.vue';

import { getMessageTrendChartOptions } from '../chart-options';

defineOptions({ name: 'MessageTrendCard' });

const messageChartRef = ref();
const { renderEcharts } = useEcharts(messageChartRef);

const loading = ref(false); // 加载状态
const messageData = ref<IotStatisticsApi.DeviceMessageSummaryByDateRespVO[]>(
  [],
); // 消息趋势数据
const isFirstMount = ref(true); // 首次挂载标记，用于跳过子组件 mount 时的默认 emit

/** 时间范围（仅日期，不包含时分秒） */
const dateRange = ref<[string, string]>([
  // 默认显示最近一周的数据（截至昨天）
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
]);

/** 将日期范围转换为带时分秒的格式 */
function formatDateRangeWithTime(dates: [string, string]): [string, string] {
  return [`${dates[0]} 00:00:00`, `${dates[1]} 23:59:59`];
}

/** 查询参数 */
const queryParams = reactive<IotStatisticsApi.DeviceMessageReqVO>({
  interval: 1, // 默认按天
  times: formatDateRangeWithTime(dateRange.value),
});

/** 是否有数据 */
const hasData = computed(() => {
  return messageData.value && messageData.value.length > 0;
});

/** 时间间隔字典选项 */
const intervalOptions = computed(() =>
  getDictOptions(DICT_TYPE.DATE_INTERVAL, 'number').map((item) => ({
    label: item.label,
    value: item.value as number,
  })),
);

/** 处理查询操作 */
function handleQuery() {
  fetchMessageData();
}

/** 处理时间范围变化 */
function handleDateRangeChange(times?: [Dayjs, Dayjs]) {
  if (!times || times.length !== 2) {
    return;
  }
  dateRange.value = [
    dayjs(times[0]).format('YYYY-MM-DD'),
    dayjs(times[1]).format('YYYY-MM-DD'),
  ];
  // 将选择的日期转换为带时分秒的格式（开始日期 00:00:00，结束日期 23:59:59）
  queryParams.times = formatDateRangeWithTime(dateRange.value);
  if (isFirstMount.value) {
    // 子组件 ShortcutDateRangePicker mount 时会 emit 一次默认日期范围，跳过 fetch；
    // 首次请求统一由父组件 onMounted 发起，避免双请求
    return;
  }
  handleQuery();
}

/** 处理时间间隔变化 */
function handleIntervalChange() {
  handleQuery();
}

/** 获取消息统计数据 */
async function fetchMessageData() {
  if (!queryParams.times || queryParams.times.length !== 2) {
    return;
  }

  loading.value = true;
  try {
    messageData.value = await getDeviceMessageSummaryByDate(queryParams);
  } catch {
    messageData.value = [];
  } finally {
    loading.value = false;
    await renderChartWhenReady();
  }
}

/** 初始化图表 */
function initChart() {
  // 检查数据是否存在
  if (!hasData.value) {
    return;
  }

  const times = messageData.value.map((item) => item.time);
  const upstreamData = messageData.value.map((item) => item.upstreamCount);
  const downstreamData = messageData.value.map((item) => item.downstreamCount);
  renderEcharts(
    getMessageTrendChartOptions(times, upstreamData, downstreamData),
  );
}

/** 确保图表容器已经可见后再渲染 */
async function renderChartWhenReady() {
  if (!hasData.value) {
    return;
  }
  // 等待 Card loading 状态、v-show 等 DOM 更新完成
  await nextTick();
  await nextTick();
  initChart();
}
// 父组件挂载后统一发起首次请求；
// 原因：子组件 ShortcutDateRangePicker 早期 emit 触发的请求落在 useEcharts isActiveRef = false 阶段，会被 renderEcharts 静默丢弃；
// 通过 handleDateRangeChange 在 isFirstMount=true 时跳过 fetch，由这里统一发起一次，避免双请求
onMounted(() => {
  fetchMessageData();
  isFirstMount.value = false;
});
</script>

<template>
  <ElCard class="h-full">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <span class="text-base font-medium text-gray-600">消息量统计</span>
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="whitespace-nowrap text-sm text-gray-500">
              时间范围
            </span>
            <ShortcutDateRangePicker @change="handleDateRangeChange" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">时间间隔</span>
            <ElSelect
              v-model="queryParams.interval"
              placeholder="间隔类型"
              :style="{ width: '80px' }"
              @change="handleIntervalChange"
            >
              <ElOption
                v-for="opt in intervalOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </div>
        </div>
      </div>
    </template>

    <!-- 加载中状态 -->
    <div
      v-show="loading && !hasData"
      class="flex h-[300px] items-center justify-center"
    >
      <ElEmpty description="加载中..." />
    </div>
    <!-- 无数据状态 -->
    <div
      v-show="!loading && !hasData"
      class="flex h-[300px] items-center justify-center"
    >
      <ElEmpty description="暂无数据" />
    </div>
    <!-- 图表容器 - 使用 v-show 而非 v-if，确保组件始终挂载 -->
    <div v-show="hasData">
      <EchartsUI ref="messageChartRef" class="h-[300px] w-full" />
    </div>
  </ElCard>
</template>
