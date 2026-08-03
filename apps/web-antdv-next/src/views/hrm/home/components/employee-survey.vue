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

defineOptions({ name: 'HrmHomeEmployeeSurvey' });

const props = defineProps<{
  survey?: HrmHomeApi.HrHomeEmployeeSurvey;
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canQueryEmployee = hasAccessByCodes(['hrm:employee:query']);
const currentMonthRange = `${dayjs().startOf('month').format('YYYY.MM.DD')}-${dayjs()
  .endOf('month')
  .format('YYYY.MM.DD')}`;

const surveyItems = computed(() => [
  {
    label: '在职',
    surveyType: undefined,
    value: props.survey?.activeCount || 0,
  },
  {
    label: '入职',
    surveyType: HrmEmployeeSurveyType.ENTRY,
    value: props.survey?.entryThisMonthCount || 0,
  },
  {
    label: '待入职',
    surveyType: HrmEmployeeSurveyType.PENDING_ENTRY,
    value: props.survey?.pendingEntryThisMonthCount || 0,
  },
  {
    label: '离职',
    surveyType: HrmEmployeeSurveyType.LEAVE,
    value: props.survey?.leaveThisMonthCount || 0,
  },
  {
    label: '待离职',
    surveyType: HrmEmployeeSurveyType.PENDING_LEAVE,
    value: props.survey?.pendingLeaveThisMonthCount || 0,
  },
  {
    label: '转正',
    surveyType: HrmEmployeeSurveyType.REGULAR,
    value: props.survey?.regularThisMonthCount || 0,
  },
  {
    label: '调岗',
    surveyType: HrmEmployeeSurveyType.TRANSFER,
    value: props.survey?.transferThisMonthCount || 0,
  },
]);

/** 打开人事概况对应的员工列表 */
function goEmployeeSurvey(surveyType?: HrmEmployeeSurveyTypeValue) {
  if (!canQueryEmployee) {
    return;
  }
  if (surveyType === undefined) {
    router.push({
      name: 'HrmEmployee',
      query: { statusCategory: HrmEmployeeStatusTab.ACTIVE },
    });
    return;
  }
  router.push({ name: 'HrmEmployee', query: { surveyType } });
}
</script>

<template>
  <Card :title="`人事概况（${currentMonthRange}）`">
    <div class="grid grid-cols-7 max-xl:grid-cols-4">
      <button
        v-for="(item, index) in surveyItems"
        :key="item.label"
        :disabled="!canQueryEmployee"
        class="flex min-h-[88px] flex-col items-center justify-center border-0 bg-transparent"
        :class="[
          canQueryEmployee ? 'group cursor-pointer' : 'cursor-default',
          index < surveyItems.length - 1
            ? 'border-border border-r border-solid'
            : '',
          index === 0 ? 'border-border mr-6 border-r max-xl:mr-0' : '',
        ]"
        type="button"
        @click="goEmployeeSurvey(item.surveyType)"
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
