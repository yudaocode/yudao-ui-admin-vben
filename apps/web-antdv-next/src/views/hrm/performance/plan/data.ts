import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { HrmPerformancePlanStatus } from '#/views/hrm/utils/constants';
import { formatHrmDateRange } from '#/views/hrm/utils/format-performance';

/** 列表搜索 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '计划名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入计划名称',
        allowClear: true,
      },
    },
  ];
}

/** 状态 Tab */
export function useStatusTabs(countMap: Record<number, number>) {
  return [
    {
      label: '未开始',
      value: HrmPerformancePlanStatus.NOT_STARTED,
      count: countMap[HrmPerformancePlanStatus.NOT_STARTED] || 0,
    },
    {
      label: '进行中',
      value: HrmPerformancePlanStatus.RUNNING,
      count: countMap[HrmPerformancePlanStatus.RUNNING] || 0,
    },
    {
      label: '已归档',
      value: HrmPerformancePlanStatus.ARCHIVED,
      count: countMap[HrmPerformancePlanStatus.ARCHIVED] || 0,
    },
    {
      label: '已终止',
      value: HrmPerformancePlanStatus.TERMINATED,
      count: countMap[HrmPerformancePlanStatus.TERMINATED] || 0,
    },
  ];
}

/** 列表列 */
export function useGridColumns(): VxeTableGridOptions<HrmPerformancePlanApi.PerformancePlan>['columns'] {
  return [
    {
      field: 'name',
      title: '计划名称',
      minWidth: 180,
      slots: { default: 'planName' },
    },
    { field: 'assessmentTemplateName', title: '考核模板', minWidth: 150 },
    { field: 'resultTemplateName', title: '结果模板', minWidth: 140 },
    { field: 'cycle', title: '考核周期', width: 120, align: 'center' },
    {
      field: 'startTime',
      title: '起止日期',
      minWidth: 190,
      align: 'center',
      formatter: ({ row }) => formatHrmDateRange(row.startTime, row.endTime),
    },
    {
      field: 'employeeCount',
      title: '参评/完成',
      width: 110,
      align: 'center',
      formatter: ({ row }) =>
        `${row.employeeCount || 0} / ${row.finishedCount || 0}`,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS },
      },
    },
    {
      field: 'stageType',
      title: '阶段',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS },
      },
    },
    {
      field: 'stageCountMap',
      title: '阶段人数',
      minWidth: 260,
      slots: { default: 'stageCount' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 170,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      minWidth: 380,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 阶段 Tag 文案 */
export function formatStageCountLabel(stageType: number, count: number) {
  return `${getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, stageType) || '未知阶段'}（${count}）`;
}

export { HrmPerformancePlanStatus };
