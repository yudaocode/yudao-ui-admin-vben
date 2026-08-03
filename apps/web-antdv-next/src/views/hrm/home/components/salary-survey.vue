<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card, Empty } from 'antdv-next';

import { formatHrmMoneyWithThousands } from '#/views/hrm/utils/format';

import { getSalaryDeptPieChartOptions } from '../chart-options';

defineOptions({ name: 'HrmHomeSalarySurvey' });

const props = defineProps<{
  survey?: HrmHomeApi.HrHomeSalarySurvey;
}>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canQuerySalary = hasAccessByCodes(['hrm:salary:month-record:query']);
const canOpenSalary = computed(
  () => canQuerySalary && !!props.survey?.monthRecordId,
);
const chartRef = ref();
const { renderEcharts } = useEcharts(chartRef);

const surveyItems = computed(() => [
  {
    label: '计薪人员',
    value: props.survey?.employeeCount || 0,
  },
  {
    label: '实发工资（元）',
    value: formatHrmMoneyWithThousands(props.survey?.realPaySalary),
  },
]);

const hasChartData = computed(
  () => (props.survey?.deptProportions?.length || 0) > 0,
);

/** 渲染部门薪资占比图表 */
async function renderChart() {
  if (!hasChartData.value) {
    return;
  }
  await nextTick();
  await renderEcharts(
    getSalaryDeptPieChartOptions(props.survey?.deptProportions || []),
  );
}

watch(
  () => props.survey,
  () => {
    renderChart();
  },
  { deep: true },
);

/** 初始化 */
onMounted(() => {
  renderChart();
});

/** 打开上月工资表详情 */
function goSalaryRecord() {
  if (!canOpenSalary.value) {
    return;
  }
  router.push({
    name: 'HrmSalaryHistoryDetail',
    params: { id: props.survey?.monthRecordId },
  });
}
</script>

<template>
  <Card title="上月薪资概况">
    <div class="flex items-stretch">
      <div class="grid w-[34%] grid-cols-2 items-center">
        <button
          v-for="(item, index) in surveyItems"
          :key="item.label"
          :disabled="!canOpenSalary"
          class="flex min-h-[88px] flex-col items-center justify-center border-0 bg-transparent"
          :class="[
            canOpenSalary ? 'group cursor-pointer' : 'cursor-default',
            index < surveyItems.length - 1
              ? 'border-border border-r border-solid'
              : '',
          ]"
          type="button"
          @click="goSalaryRecord"
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
      <div class="min-w-0 flex-1">
        <EchartsUI
          v-if="hasChartData"
          ref="chartRef"
          class="h-[220px] w-full"
        />
        <Empty
          v-else
          class="py-6"
          :image-style="{ height: '72px' }"
          description="暂无数据"
        />
      </div>
    </div>
  </Card>
</template>
