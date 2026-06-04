<script lang="ts" setup>
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { onMounted, ref } from 'vue';

import { getTeamList } from '#/api/mes/cal/team';

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

const teamList = ref<MesCalTeamApi.Team[]>([]);
const selectedTeamId = ref<number>();

/** 查询当前月份的排班日历，按选中班组过滤 */
function doFetch() {
  if (!selectedTeamId.value) {
    return;
  }
  fetchCalendar({ queryType: 'TEAM', teamId: selectedTeamId.value });
}

/** 点击左侧班组后切换并刷新日历 */
function onSelectTeam(id: number) {
  selectedTeamId.value = id;
  doFetch();
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (selectedTeamId.value) {
    doFetch();
  }
});

onMounted(async () => {
  // 假期列表与班组列表并行加载，避免假期接口无权限或异常时阻断班组排班查询
  void loadHolidays();
  teamList.value = await getTeamList();
  if (teamList.value.length > 0 && teamList.value[0]?.id) {
    onSelectTeam(teamList.value[0].id);
  }
});
</script>

<template>
  <div class="flex">
    <!-- 左侧：班组列表选择 -->
    <div class="border-border mr-3 w-[150px] shrink-0 overflow-hidden rounded border">
      <div
        v-for="team in teamList"
        :key="team.id"
        class="text-foreground border-border hover:bg-muted/50 cursor-pointer border-b px-4 py-2.5 text-sm transition-colors last:border-b-0"
        :class="
          selectedTeamId === team.id
            ? 'bg-primary/10 text-primary font-medium'
            : ''
        "
        @click="onSelectTeam(team.id!)"
      >
        {{ team.name }}
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
