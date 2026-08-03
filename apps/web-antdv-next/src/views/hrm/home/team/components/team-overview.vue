<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';
import type { HrmEmployeeSurveyTypeValue } from '#/views/hrm/utils/constants';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';

import { Card } from 'antdv-next';
import dayjs from 'dayjs';

import {
  HrmEmployeeStatusTab,
  HrmEmployeeSurveyType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmTeamHomeOverview' });

const props = defineProps<{
  leaderEmployeeId?: number;
  overview?: HrmHomeApi.TeamHomeOverview;
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canOpenEmployeeList = computed(
  () => !!props.leaderEmployeeId && hasAccessByCodes(['hrm:employee:query']),
);
const currentMonthRange = `${dayjs().startOf('month').format('YYYY.MM.DD')}-${dayjs()
  .endOf('month')
  .format('YYYY.MM.DD')}`;

const overviewItems = computed(() => [
  {
    label: '团队人数',
    surveyType: undefined,
    value: props.overview?.employeeCount || 0,
  },
  {
    label: '本月入职',
    surveyType: HrmEmployeeSurveyType.ENTRY,
    value: props.overview?.entryThisMonthCount || 0,
  },
  {
    label: '本月离职',
    surveyType: HrmEmployeeSurveyType.LEAVE,
    value: props.overview?.leaveThisMonthCount || 0,
  },
  {
    label: '本月转正',
    surveyType: HrmEmployeeSurveyType.REGULAR,
    value: props.overview?.regularThisMonthCount || 0,
  },
]);

/** 打开当前直属团队对应的员工列表 */
function openEmployeeList(surveyType?: HrmEmployeeSurveyTypeValue) {
  if (!canOpenEmployeeList.value) {
    return;
  }
  router.push({
    name: 'HrmEmployee',
    query: {
      leaderEmployeeId: props.leaderEmployeeId,
      statusCategory:
        surveyType === undefined ? HrmEmployeeStatusTab.ACTIVE : undefined,
      surveyType,
    },
  });
}
</script>

<template>
  <Card :title="`我的团队（${currentMonthRange}）`">
    <div class="grid grid-cols-4 max-md:grid-cols-2">
      <button
        v-for="(item, index) in overviewItems"
        :key="item.label"
        :disabled="!canOpenEmployeeList"
        class="flex min-h-[88px] flex-col items-center justify-center border-0 bg-transparent"
        :class="[
          canOpenEmployeeList ? 'group cursor-pointer' : 'cursor-default',
          index < overviewItems.length - 1
            ? 'border-border border-r border-solid'
            : '',
          index === 0 ? 'border-border mr-6 border-r max-md:mr-0' : '',
        ]"
        type="button"
        @click="openEmployeeList(item.surveyType)"
      >
        <strong class="text-[24px] leading-8 group-hover:text-primary">
          {{ item.value }}
        </strong>
        <span
          class="text-muted-foreground mt-2 text-[13px] group-hover:text-primary"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
  </Card>
</template>
