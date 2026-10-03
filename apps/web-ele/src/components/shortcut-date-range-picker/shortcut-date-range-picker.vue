<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { onMounted, ref } from 'vue';

import dayjs from 'dayjs';
import { ElDatePicker, ElRadio, ElRadioGroup } from 'element-plus';

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
    <ElRadioGroup v-model="timeRangeType" @change="handleShortcutDaysChange">
      <ElRadio
        v-for="option in timeRangeOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </ElRadio>
    </ElRadioGroup>
    <ElDatePicker
      v-model="times as any"
      type="daterange"
      :shortcuts="rangePickerProps.shortcuts"
      :format="rangePickerProps.format"
      :value-format="rangePickerProps.valueFormat"
      :start-placeholder="rangePickerProps.startPlaceholder"
      :end-placeholder="rangePickerProps.endPlaceholder"
      :default-time="rangePickerProps.defaultTime as any"
      class="!w-[215px]"
      @change="handleDateRangeChange"
    />
    <slot></slot>
  </div>
</template>
