<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, ref } from 'vue';

import { DateRangePicker, Radio, RadioGroup } from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';
import { getRangePickerDefaultProps } from '#/utils/rangePickerProps';

/** 快捷日期范围选择组件 */
defineOptions({ name: 'ShortcutDateRangePicker' });

const emits = defineEmits<{
  change: [times: [Dayjs, Dayjs]];
}>();

const times = ref<[Dayjs, Dayjs]>(); // 日期范围

const rangePickerProps = getRangePickerDefaultProps();
const timeRangeOptions = [
  { label: $t('utils.rangePicker.yesterday'), value: 'yesterday', days: 1 },
  { label: $t('utils.rangePicker.last7Days'), value: 'last7Days', days: 7 },
  { label: $t('utils.rangePicker.last30Days'), value: 'last30Days', days: 30 },
];
const timeRangeType = ref('last7Days'); // 默认选中最近 7 天

/** 设置时间范围 */
function setTimes() {
  const selectedOption = timeRangeOptions.find(
    (option) => option.value === timeRangeType.value,
  );
  if (selectedOption) {
    times.value = [
      dayjs().subtract(selectedOption.days, 'day').startOf('day'),
      dayjs().subtract(1, 'day').endOf('day'),
    ];
  }
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
    <DateRangePicker
      v-model:value="times"
      :format="rangePickerProps.format"
      :placeholder="rangePickerProps.placeholder"
      :presets="rangePickerProps.presets"
      class="!w-full !max-w-96"
      @change="handleDateRangeChange"
    />
    <slot></slot>
  </div>
</template>
