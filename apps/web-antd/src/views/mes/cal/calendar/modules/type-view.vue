<script lang="ts" setup>
import type { DictDataType } from '@vben/hooks';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { CalendarPanel, useCalendar } from '../components';

const {
  calendarDayMap,
  currentDate,
  fetchCalendar,
  holidaySet,
  loadHolidays,
  loading,
  watchMonth,
} = useCalendar();

const typeOptions = ref<DictDataType[]>([]);
const selectedType = ref<number>();

/** 查询当前月份的排班日历，按选中分类过滤 */
function doFetch() {
  if (selectedType.value === undefined) {
    return;
  }
  fetchCalendar({ calendarType: selectedType.value, queryType: 'TYPE' });
}

/** 点击左侧分类后切换并刷新日历 */
function onSelectType(value: number) {
  selectedType.value = value;
  doFetch();
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (selectedType.value !== undefined) {
    doFetch();
  }
});

onMounted(() => {
  // 假期列表与排班主数据并行加载，避免假期接口无权限或异常时阻断分类/排班加载
  void loadHolidays();
  typeOptions.value = getDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE, 'number');
  if (typeOptions.value.length > 0) {
    onSelectType(typeOptions.value[0]!.value as number);
  }
});
</script>

<template>
  <div class="flex">
    <!-- 左侧：班组类型选择 -->
    <div class="border-border mr-3 w-[150px] shrink-0 overflow-hidden rounded border">
      <div
        v-for="item in typeOptions"
        :key="item.value as number"
        class="text-foreground border-border hover:bg-muted/50 cursor-pointer border-b px-4 py-2.5 text-sm transition-colors last:border-b-0"
        :class="
          selectedType === item.value
            ? 'bg-primary/10 text-primary font-medium'
            : ''
        "
        @click="onSelectType(item.value as number)"
      >
        {{ item.label }}
      </div>
    </div>

    <!-- 右侧：日历 -->
    <div class="flex-1">
      <CalendarPanel
        v-model:current-date="currentDate"
        :calendar-day-map="calendarDayMap"
        :holiday-set="holidaySet"
        :loading="loading"
      />
    </div>
  </div>
</template>
