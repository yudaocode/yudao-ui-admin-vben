import type { EChartsOption } from '@vben/plugins/echarts';

import type { HrmHomeApi } from '#/api/hrm/home';

/** 部门薪资占比饼图配置 */
export function getSalaryDeptPieChartOptions(
  deptProportions: HrmHomeApi.HrHomeSalaryDept[],
): EChartsOption {
  return {
    title: {
      left: 'center',
      text: '部门薪资占比',
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
      },
    },
    tooltip: {
      formatter: '{b}：{c}%',
      trigger: 'item',
    },
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
    },
    series: [
      {
        center: ['50%', '46%'],
        data: deptProportions.map((item) => ({
          name: item.deptName,
          value: Number((item.proportion * 100).toFixed(2)),
        })),
        radius: '48%',
        stillShowZeroSum: false,
        type: 'pie',
      },
    ],
  };
}

/** 团队概况饼图配置 */
export function getTeamSurveyPieChartOptions(
  data: Array<{ name: string; value: number }>,
): EChartsOption {
  return {
    color: [
      '#409eff',
      '#67c23a',
      '#e6a23c',
      '#f56c6c',
      '#909399',
      '#00a6a6',
      '#7b61ff',
      '#d97706',
    ],
    tooltip: {
      formatter: '{b}<br/>{c} 人（{d}%）',
      trigger: 'item',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
    },
    series: [
      {
        avoidLabelOverlap: true,
        center: ['50%', '43%'],
        data,
        label: {
          formatter: '{b}\n{c} 人',
        },
        radius: ['42%', '68%'],
        type: 'pie',
      },
    ],
  };
}
