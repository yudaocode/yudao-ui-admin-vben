<script lang="ts" setup>
import { computed } from 'vue';

import dayjs from 'dayjs';
import { ElDatePicker } from 'element-plus';

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

const datePickerValue = computed(
  () => monthRange.value as [string, string],
); // 会计期间范围控件值

/** 禁用账套启用月份之前的日期 */
function disabledDate(date: Date) {
  return Boolean(
    accountSetStartMonth.value &&
      dayjs(date).format('YYYY-MM') < accountSetStartMonth.value,
  );
}

/** 期间变化，已配置 value-format，运行时实际为 YYYY-MM 字符串数组 */
function handleChange(value: [string, string] | null) {
  const range = value || [];
  monthRange.value = range;
  emit('change', range.length > 0 ? range : undefined);
}
</script>

<template>
  <ElDatePicker
    :clearable="false"
    :disabled-date="disabledDate"
    end-placeholder="结束月份"
    :model-value="datePickerValue"
    start-placeholder="开始月份"
    type="monthrange"
    value-format="YYYY-MM"
    class="!w-60"
    @change="handleChange"
  />
</template>
