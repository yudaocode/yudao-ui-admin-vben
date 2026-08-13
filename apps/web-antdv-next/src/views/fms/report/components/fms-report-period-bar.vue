<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, DatePicker, RadioButton, RadioGroup } from 'antdv-next';
import dayjs from 'dayjs';

import { getAccountSet } from '#/api/fms/config/account-set';
import { useFmsStore } from '#/views/fms/store/fms';

defineOptions({ name: 'FmsReportPeriodBar' });

const emit = defineEmits<{
  query: [value: { endMonth: string; label: string; startMonth: string }];
}>();

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const periodType = ref<'month' | 'quarter'>('month'); // 报表周期
const reportMonth = ref(dayjs().format('YYYY-MM')); // 会计期间
const startMonth = ref(dayjs().format('YYYY-MM')); // 账套启用月份，可选期间的最早月份
const currentMonth = ref(dayjs().format('YYYY-MM')); // 账套当前月份，可选期间的最晚月份

watch(accountSetId, initializePeriod, { immediate: true });

/** 初始化可选期间并触发首次查询 */
async function initializePeriod() {
  const initializingAccountSetId = accountSetId.value;
  if (!initializingAccountSetId) return;
  const [currentMonthValue, accountSet] = await Promise.all([
    fmsStore.loadCurrentMonth(),
    getAccountSet(initializingAccountSetId),
  ]);
  if (accountSetId.value !== initializingAccountSetId) return;
  startMonth.value = dayjs(accountSet.startTime).format('YYYY-MM');
  currentMonth.value = currentMonthValue || dayjs().format('YYYY-MM');
  reportMonth.value = currentMonth.value;
  emitQuery();
}

/** 禁用账套启用月份之前和当前月份之后的日期 */
function disabledDate(date: Dayjs) {
  const month = date.format('YYYY-MM');
  return month < startMonth.value || month > currentMonth.value;
}

/** 触发查询：月报取当月，季报取所选月份所在季度 */
function emitQuery() {
  const month = dayjs(`${reportMonth.value}-01`);
  if (periodType.value === 'month') {
    emit('query', {
      startMonth: month.format('YYYY-MM'),
      endMonth: month.format('YYYY-MM'),
      label: month.format('YYYY年MM月'),
    });
    return;
  }
  const quarter = Math.floor(month.month() / 3) + 1;
  const quarterStartMonth = month.month((quarter - 1) * 3);
  emit('query', {
    startMonth: quarterStartMonth.format('YYYY-MM'),
    endMonth: quarterStartMonth.add(2, 'month').format('YYYY-MM'),
    label: `${month.year()}年第${quarter}季度`,
  });
}
</script>

<template>
  <!-- 报表周期与会计期间 -->
  <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
    <div class="flex items-center gap-2">
      <span class="shrink-0 text-sm">报表周期</span>
      <RadioGroup
        v-model:value="periodType"
        button-style="solid"
        @change="emitQuery"
      >
        <RadioButton value="month">月报</RadioButton>
        <RadioButton value="quarter">季报</RadioButton>
      </RadioGroup>
    </div>
    <div class="flex items-center gap-2">
      <span class="shrink-0 text-sm">会计期间</span>
      <DatePicker
        v-model:value="reportMonth"
        :allow-clear="false"
        :disabled-date="disabledDate"
        picker="month"
        :placeholder="periodType === 'month' ? '选择月份' : '选择季度内月份'"
        value-format="YYYY-MM"
        @change="emitQuery"
      />
    </div>
    <div class="flex items-center gap-2">
      <Button @click="emitQuery">
        <template #icon>
          <IconifyIcon icon="lucide:refresh-ccw" />
        </template>
        刷新
      </Button>
      <slot></slot>
    </div>
  </div>
</template>
