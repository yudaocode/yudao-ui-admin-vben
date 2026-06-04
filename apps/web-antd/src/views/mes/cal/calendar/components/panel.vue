<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { MesCalCalendarApi } from '#/api/mes/cal/calendar';

import { Button, Calendar, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import CalendarDateCell from './date-cell.vue';
import CalendarLegend from './legend.vue';

defineProps<{
  calendarDayMap: Map<string, MesCalCalendarApi.CalendarDay>;
  holidaySet: Set<string>;
  loading?: boolean;
}>();

const currentDate = defineModel<Dayjs>('currentDate', { required: true });

/** 切换到上月 */
function handlePrevMonth() {
  currentDate.value = currentDate.value.subtract(1, 'month');
}

/** 切换到下月 */
function handleNextMonth() {
  currentDate.value = currentDate.value.add(1, 'month');
}

/** 切换到今天 */
function handleToday() {
  currentDate.value = dayjs();
}
</script>

<template>
  <div>
    <CalendarLegend />
    <Spin :spinning="loading" wrapper-class-name="block">
      <div class="bg-card overflow-hidden rounded-md">
        <Calendar v-model:value="currentDate" class="mes-calendar-panel">
          <template #headerRender>
            <div class="flex items-center justify-between p-3">
              <div class="text-base font-medium">
                {{ currentDate.format('YYYY 年 MM 月') }}
              </div>
              <div class="flex items-center gap-2">
                <Button @click="handlePrevMonth">上月</Button>
                <Button @click="handleToday">今天</Button>
                <Button @click="handleNextMonth">下月</Button>
              </div>
            </div>
          </template>
          <template #dateFullCellRender="{ current: date }">
            <div class="h-[110px] text-left">
              <CalendarDateCell
                v-if="date.isSame(currentDate, 'month')"
                :calendar-day-map="calendarDayMap"
                :day="date.format('YYYY-MM-DD')"
                :holiday-set="holidaySet"
              />
              <div v-else class="text-muted-foreground/50 p-1 text-base">
                {{ date.format('DD') }}
              </div>
            </div>
          </template>
        </Calendar>
      </div>
    </Spin>
  </div>
</template>

<!--
  仅保留访问 Ant Design Calendar 内部 DOM 的样式，
  其余已通过 Tailwind 工具类实现
-->
<style lang="scss" scoped>
.mes-calendar-panel {
  :deep(.ant-picker-content) {
    border-top: 1px solid hsl(var(--border));
    border-left: 1px solid hsl(var(--border));

    th {
      padding: 8px 12px;
      text-align: left;
      background: transparent;
      border-right: 1px solid hsl(var(--border));
      border-bottom: 1px solid hsl(var(--border));
    }

    td {
      padding: 0;
      border-right: 1px solid hsl(var(--border));
      border-bottom: 1px solid hsl(var(--border));
    }
  }

  :deep(.ant-picker-cell) {
    padding: 0;

    &::before {
      display: none;
    }
  }
}
</style>
