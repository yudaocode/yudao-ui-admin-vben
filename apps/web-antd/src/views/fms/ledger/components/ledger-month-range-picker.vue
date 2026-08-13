<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed } from 'vue';

import { RangePicker } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsLedgerMonthRangePicker' });

const emit = defineEmits<{ change: [value: string[] | undefined] }>();

const monthRange = defineModel<string[]>({ required: true }); // 会计期间范围

const fmsStore = useFmsStore(); // FMS 状态
const accountSetStartMonth = computed(() => {
  const accountSet = fmsStore.getAccountSetList.find(
    (item) => item.id === fmsStore.getAccountSetId,
  );
  return accountSet?.startTime
    ? dayjs(accountSet.startTime).format('YYYY-MM')
    : undefined;
}); // 账套启用月份

const rangePickerValue = computed(
  () => monthRange.value as [string, string],
); // 会计期间范围控件值

/** 禁用账套启用月份之前的日期 */
function disabledDate(date: Dayjs) {
  return Boolean(
    accountSetStartMonth.value &&
      date.format('YYYY-MM') < accountSetStartMonth.value,
  );
}

/** 期间变化，已配置 valueFormat，运行时实际为 YYYY-MM 字符串数组 */
function handleChange(value: [Dayjs, Dayjs] | [string, string]) {
  const range = value as unknown as string[];
  monthRange.value = range || [];
  emit('change', range || undefined);
}
</script>

<template>
  <RangePicker
    :allow-clear="false"
    :disabled-date="disabledDate"
    picker="month"
    :placeholder="['开始月份', '结束月份']"
    :value="rangePickerValue"
    value-format="YYYY-MM"
    class="w-60"
    @change="handleChange"
  />
</template>
