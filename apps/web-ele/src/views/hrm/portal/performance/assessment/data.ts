import type { Component } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { markRaw } from 'vue';

import {
  formatHrmDate,
  formatHrmDateTime,
  formatHrmScore,
} from '#/views/hrm/utils/format';

type PortalAssessment =
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment;
type PortalQuota = NonNullable<PortalAssessment['quotas']>[number];

/** 绩效档案搜索表单 */
export function useHistoryGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '考核名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入考核名称',
      },
    },
  ];
}

/** 绩效档案列表字段 */
export function useHistoryGridColumns(): VxeTableGridOptions<HrmPortalPerformanceAssessmentApi.AssessmentSummary>['columns'] {
  return [
    {
      field: 'name',
      title: '考核名称',
      minWidth: 220,
      showOverflow: true,
    },
    {
      field: 'cycle',
      title: '考核周期',
      minWidth: 210,
      formatter: ({ row }) =>
        `${formatHrmDate(row.startTime)} 至 ${formatHrmDate(row.endTime)}`,
    },
    {
      field: 'score',
      title: '绩效得分',
      width: 110,
      align: 'center',
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined
          ? '-'
          : formatHrmScore(Number(cellValue)),
    },
    {
      field: 'resultLevel',
      title: '绩效等级',
      width: 110,
      align: 'center',
      slots: { default: 'resultLevel' },
    },
    {
      field: 'coefficient',
      title: '绩效系数',
      width: 100,
      align: 'center',
    },
    {
      field: 'archiveTime',
      title: '归档时间',
      width: 180,
      formatter: ({ cellValue }) =>
        formatHrmDateTime(
          cellValue as Date | null | number | string | undefined,
        ),
    },
    {
      title: '操作',
      width: 90,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 绩效指标明细字段 */
export function useQuotaGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'dimensionName', title: '维度', minWidth: 120 },
    { field: 'name', title: '指标', minWidth: 160 },
    { field: 'standard', title: '考核标准', minWidth: 200 },
    {
      field: 'weight',
      title: '权重',
      width: 80,
      align: 'center',
      formatter: ({ cellValue }) => `${Number(cellValue || 0)}%`,
    },
    {
      field: 'finalScore',
      title: '最终得分',
      width: 90,
      align: 'center',
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined
          ? '-'
          : formatHrmScore(Number(cellValue)),
    },
  ];
}

/** 评分流程明细字段 */
export function useReviewGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '评分阶段', minWidth: 130 },
    { field: 'handlerName', title: '评分人', minWidth: 120 },
    {
      field: 'weight',
      title: '权重',
      width: 80,
      align: 'center',
      formatter: ({ cellValue }) => `${Number(cellValue || 0)}%`,
    },
    {
      field: 'score',
      title: '阶段得分',
      width: 90,
      align: 'center',
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined
          ? '-'
          : formatHrmScore(Number(cellValue)),
    },
    { field: 'comment', title: '评语', minWidth: 160 },
  ];
}

/** 待办任务字段 */
export function useTaskGridColumns(
  selfTask: boolean,
): VxeTableGridOptions<PortalAssessment>['columns'] {
  const common = [
    {
      type: 'seq' as const,
      title: '序号',
      width: 70,
      align: 'center' as const,
    },
    {
      field: 'name',
      title: '考核名称',
      minWidth: 220,
      showOverflow: 'tooltip' as const,
    },
  ];
  return selfTask
    ? [
        ...common,
        { title: '考核周期', minWidth: 210, slots: { default: 'cycle' } },
        {
          title: '当前阶段',
          width: 130,
          align: 'center',
          slots: { default: 'currentStage' },
        },
        {
          title: '绩效得分',
          width: 110,
          align: 'center',
          slots: { default: 'score' },
        },
        {
          title: '绩效等级',
          width: 110,
          align: 'center',
          slots: { default: 'resultLevel' },
        },
        {
          field: 'coefficient',
          title: '绩效系数',
          width: 100,
          align: 'center',
        },
        {
          title: '操作',
          width: 260,
          align: 'center',
          fixed: 'right',
          slots: { default: 'actions' },
        },
      ]
    : [
        ...common,
        { title: '被考核人', minWidth: 160, slots: { default: 'employee' } },
        {
          title: '当前阶段',
          width: 140,
          align: 'center',
          slots: { default: 'currentStage' },
        },
        {
          title: '指标数/评分权重/绩效得分',
          width: 180,
          align: 'center',
          slots: { default: 'metric' },
        },
        {
          title: '操作',
          width: 110,
          align: 'center',
          fixed: 'right',
          slots: { default: 'actions' },
        },
      ];
}

/** 指标确认明细字段 */
export function useTargetConfirmGridColumns(): VxeTableGridOptions<PortalQuota>['columns'] {
  return [
    { field: 'dimensionName', title: '维度', minWidth: 120 },
    { field: 'name', title: '指标', minWidth: 160 },
    { field: 'description', title: '指标说明', minWidth: 180 },
    { field: 'standard', title: '考核标准', minWidth: 210 },
    {
      title: '权重',
      width: 130,
      align: 'center',
      slots: { default: 'weight' },
    },
  ];
}

/** 绩效处理指标字段 */
export function useHandleQuotaGridColumns(): VxeTableGridOptions<PortalQuota>['columns'] {
  return [
    { field: 'dimensionName', title: '维度', minWidth: 120 },
    { field: 'name', title: '指标', minWidth: 150 },
    { field: 'targetValue', title: '目标值', minWidth: 140 },
    { field: 'actualValue', title: '实际值', minWidth: 140 },
    {
      title: '最终分',
      width: 90,
      align: 'center',
      slots: { default: 'finalScore' },
    },
  ];
}

/** 绩效评分编辑字段 */
export function useReviewEditGridColumns(): VxeTableGridOptions<PortalQuota>['columns'] {
  return [
    { field: 'dimensionName', title: '维度', minWidth: 110 },
    { field: 'name', title: '指标', minWidth: 145 },
    { field: 'targetValue', title: '目标值', minWidth: 125 },
    { title: '实际值', minWidth: 140, slots: { default: 'actualValue' } },
    { title: '评分', width: 120, slots: { default: 'finalScore' } },
    { title: '评语', minWidth: 180, slots: { default: 'comment' } },
  ];
}

/** 结果审核/申诉处理表单 */
export function useHandleFormSchema(
  mode: 'appeal' | 'result-audit',
): VbenFormSchema[] {
  return [
    {
      fieldName: 'reviewStageIds',
      label: '退回评分节点',
      component: 'CheckboxGroup',
      dependencies: {
        triggerFields: [''],
        show: () => mode === 'result-audit',
      },
      componentProps: { options: [] },
    },
    {
      fieldName: 'comment',
      label: '处理意见',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入处理意见',
        rows: 3,
        showCount: true,
      },
    },
  ];
}

/** 绩效申诉表单 */
export function useAppealFormSchema(fileUpload: Component): VbenFormSchema[] {
  return [
    {
      fieldName: 'assessmentId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'reviewStageIds',
      label: '退回评分节点',
      component: 'CheckboxGroup',
      rules: 'selectRequired',
      componentProps: { options: [] },
    },
    {
      fieldName: 'appealReason',
      label: '申诉原因',
      component: 'Textarea',
      rules: 'required',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入申诉原因',
        rows: 4,
        showCount: true,
      },
    },
    {
      fieldName: 'appealFileUrls',
      label: '申诉附件',
      component: markRaw(fileUpload),
      defaultValue: [],
      componentProps: {
        directory: 'hrm/performance/appeal',
        maxNumber: 1,
        maxSize: 20,
      },
    },
  ];
}

/** 制定指标编辑字段 */
export function useQuotaEditGridColumns(): VxeTableGridOptions<HrmPerformanceAssessmentApi.AssessmentQuota>['columns'] {
  return [
    {
      field: 'name',
      title: '指标名称',
      minWidth: 180,
      slots: { default: 'name' },
    },
    {
      field: 'description',
      title: '指标说明',
      minWidth: 190,
      slots: { default: 'description' },
    },
    {
      field: 'standard',
      title: '考核标准',
      minWidth: 220,
      slots: { default: 'standard' },
    },
    {
      field: 'weight',
      title: '指标权重',
      width: 130,
      slots: { default: 'weight' },
    },
    {
      title: '操作',
      width: 72,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
