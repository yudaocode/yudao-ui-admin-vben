<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'antdv-next';

import {
  HrmTeamHomeAgeRangeType,
  HrmTeamHomeCompanyAgeRangeType,
} from '#/views/hrm/utils/constants';
import {
  formatHrmAnalysisDictType,
  formatHrmAnalysisRangeType,
} from '#/views/hrm/utils/format';

import TeamSurveyChart from './team-survey-chart.vue';

defineOptions({ name: 'HrmTeamHomeSurvey' });

const props = defineProps<{
  survey?: HrmHomeApi.TeamHomeSurvey;
}>();

const ageRangeNames: Record<number, string> = {
  [HrmTeamHomeAgeRangeType.UNDER_18]: '17以下',
  [HrmTeamHomeAgeRangeType.AGE_18_TO_25]: '18-25',
  [HrmTeamHomeAgeRangeType.AGE_26_TO_35]: '26-35',
  [HrmTeamHomeAgeRangeType.AGE_36_TO_45]: '36-45',
  [HrmTeamHomeAgeRangeType.AGE_46_TO_55]: '46-55',
  [HrmTeamHomeAgeRangeType.AGE_56_AND_ABOVE]: '56以上',
};
const companyAgeRangeNames: Record<number, string> = {
  [HrmTeamHomeCompanyAgeRangeType.WITHIN_3_MONTHS]: '3个月内',
  [HrmTeamHomeCompanyAgeRangeType.MONTHS_3_TO_6]: '3-6个月',
  [HrmTeamHomeCompanyAgeRangeType.MONTHS_6_TO_1_YEAR]: '6个月-1年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_1_TO_3]: '1-3年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_3_TO_5]: '3-5年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_5_TO_10]: '5-10年',
  [HrmTeamHomeCompanyAgeRangeType.YEARS_10_AND_ABOVE]: '10年以上',
};

const charts = computed(() => [
  {
    data: props.survey?.statusAnalysis || [],
    formatType: (type: null | number) =>
      formatHrmAnalysisDictType(DICT_TYPE.HRM_EMPLOYEE_STATUS, type),
    key: 'status',
    title: '员工状态占比',
  },
  {
    data: props.survey?.sexAnalysis || [],
    formatType: (type: null | number) =>
      formatHrmAnalysisDictType(DICT_TYPE.SYSTEM_USER_SEX, type),
    key: 'sex',
    title: '男女性别占比',
  },
  {
    data: props.survey?.ageAnalysis || [],
    formatType: (type: null | number) =>
      formatHrmAnalysisRangeType(ageRangeNames, type),
    key: 'age',
    title: '成员年龄占比',
  },
  {
    data: props.survey?.companyAgeAnalysis || [],
    formatType: (type: null | number) =>
      formatHrmAnalysisRangeType(companyAgeRangeNames, type),
    key: 'companyAge',
    title: '成员司龄占比',
  },
]);
</script>

<template>
  <Card title="团队概况">
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 max-lg:grid-cols-1">
      <TeamSurveyChart
        v-for="chart in charts"
        :key="chart.key"
        :data="chart.data"
        :format-type="chart.formatType"
        :title="chart.title"
      />
    </div>
  </Card>
</template>
