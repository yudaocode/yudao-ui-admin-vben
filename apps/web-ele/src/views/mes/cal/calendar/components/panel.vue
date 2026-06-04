<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { MesCalCalendarApi } from '#/api/mes/cal/calendar';

import { computed } from 'vue';

import dayjs from 'dayjs';
import { ElCalendar } from 'element-plus';

import CalendarDateCell from './date-cell.vue';
import CalendarLegend from './legend.vue';

defineProps<{
  calendarDayMap: Map<string, MesCalCalendarApi.CalendarDay>;
  holidaySet: Set<string>;
  loading?: boolean;
}>();

const currentDate = defineModel<Dayjs>('currentDate', { required: true });

/** ElCalendar v-model 桥接：内部用 Dayjs，组件需要 Date */
const calendarValue = computed({
  get: () => currentDate.value.toDate(),
  set: (val: Date) => {
    currentDate.value = dayjs(val);
  },
});
</script>

<template>
  <div>
    <CalendarLegend />
    <div v-loading="loading" class="bg-card overflow-hidden rounded-md">
      <ElCalendar v-model="calendarValue" class="mes-calendar-panel">
        <template #date-cell="{ data }">
          <CalendarDateCell
            v-if="data.type === 'current-month'"
            :calendar-day-map="calendarDayMap"
            :day="data.day"
            :holiday-set="holidaySet"
          />
          <div v-else class="text-muted-foreground/50 p-1 text-base">
            {{ data.day.split('-')[2] }}
          </div>
        </template>
      </ElCalendar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 收紧 ElCalendar 默认日期单元高度，使用自定义单元 */
.mes-calendar-panel {
  :deep(.el-calendar-table .el-calendar-day) {
    height: 110px;
    padding: 0;
  }
}
</style>
