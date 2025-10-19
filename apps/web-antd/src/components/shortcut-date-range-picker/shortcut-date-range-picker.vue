<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, ref } from 'vue';

import { DatePicker, Radio, RadioGroup } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';

/** 快捷日期范围选择组件 */
defineOptions({ name: 'ShortcutDateRangePicker' });

/** 触发事件：时间范围选中 */
const emits = defineEmits<{
  change: [times: [Dayjs, Dayjs]];
}>();

/** 时间范围类型枚举 */
enum TimeRangeType {
  LAST_7_DAYS = 7,
  LAST_30_DAYS = 30,
  YESTERDAY = 1,
}

const timeRangeType = ref<TimeRangeType>(TimeRangeType.LAST_7_DAYS); // 默认选中最近7天
const times = ref<[Dayjs, Dayjs]>(); // 日期范围

/** 获取 RangePicker 的默认配置 */
const rangePickerProps = getRangePickerDefaultProps();

/** 时间范围配置 */
const timeRangeOptions = [
  { label: '昨天', value: TimeRangeType.YESTERDAY },
  { label: '最近 7 天', value: TimeRangeType.LAST_7_DAYS },
  { label: '最近 30 天', value: TimeRangeType.LAST_30_DAYS },
];

/** 设置时间范围 */
function setTimes() {
  let beginTime: Dayjs;
  let endTime: Dayjs;

  switch (timeRangeType.value) {
    case TimeRangeType.LAST_7_DAYS: {
      beginTime = dayjs().subtract(7, 'day').startOf('day');
      endTime = dayjs().subtract(1, 'day').endOf('day');
      break;
    }
    case TimeRangeType.LAST_30_DAYS: {
      beginTime = dayjs().subtract(30, 'day').startOf('day');
      endTime = dayjs().subtract(1, 'day').endOf('day');
      break;
    }
    case TimeRangeType.YESTERDAY: {
      beginTime = dayjs().subtract(1, 'day').startOf('day');
      endTime = dayjs().subtract(1, 'day').endOf('day');
      break;
    }
    default: {
      beginTime = dayjs().subtract(7, 'day').startOf('day');
      endTime = dayjs().subtract(1, 'day').endOf('day');
    }
  }

  times.value = [beginTime, endTime];
}

/** 快捷日期单选按钮选中 */
async function handleShortcutDaysChange() {
  // 设置时间范围
  setTimes();
  // 触发时间范围选中事件
  emitDateRangePicker();
}

/** 日期范围改变 */
function handleDateRangeChange() {
  emitDateRangePicker();
}

/** 触发时间范围选中事件 */
function emitDateRangePicker() {
  if (times.value && times.value.length === 2) {
    emits('change', times.value);
  }
}

/** 初始化 */
onMounted(() => {
  handleShortcutDaysChange();
});
</script>

<template>
  <div class="flex items-center gap-2">
    <RadioGroup
      v-model:value="timeRangeType"
      @change="handleShortcutDaysChange"
    >
      <Radio
        v-for="option in timeRangeOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </Radio>
    </RadioGroup>
    <DatePicker.RangePicker
      v-model:value="times"
      :show-time="rangePickerProps.showTime"
      :format="rangePickerProps.format"
      :value-format="rangePickerProps.valueFormat"
      class="!w-[240px]"
      @change="handleDateRangeChange"
    />
    <slot></slot>
  </div>
</template>
