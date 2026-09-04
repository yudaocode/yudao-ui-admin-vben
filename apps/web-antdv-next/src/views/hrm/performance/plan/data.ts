import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { z } from '#/adapter/form';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
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

/** 评分流程列 */
export function useReviewStageGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { align: 'center', type: 'seq', title: '顺序', width: 70 },
    { field: 'name', minWidth: 180, title: '评分阶段' },
    {
      field: 'raterType',
      minWidth: 150,
      slots: { default: 'raterType' },
      title: '评分人类型',
    },
    {
      align: 'center',
      field: 'weight',
      slots: { default: 'weight' },
      title: '权重',
      width: 90,
    },
    {
      align: 'center',
      field: 'requiredSetting',
      formatter: ({ cellValue }) => (cellValue ? '是' : '否'),
      title: '评语必填',
      width: 100,
    },
    {
      align: 'center',
      field: 'rejectAuthority',
      formatter: ({ cellValue }) => (cellValue ? '是' : '否'),
      title: '允许驳回',
      width: 100,
    },
  ];
}

/** 处理人阶段列 */
export function useHandlerStageGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'type', slots: { default: 'type' }, title: '处理人', width: 180 },
    {
      field: 'scope',
      minWidth: 260,
      slots: { default: 'scope' },
      title: '处理人范围',
    },
    {
      align: 'center',
      slots: { default: 'actions' },
      title: '操作',
      width: 72,
    },
  ];
}

/** 评分阶段编辑列 */
export function useReviewEditGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'raterType',
      slots: { default: 'raterType' },
      title: '评分人',
      width: 160,
    },
    {
      field: 'raterScope',
      minWidth: 220,
      slots: { default: 'raterScope' },
      title: '评分人范围',
    },
    {
      field: 'weight',
      slots: { default: 'weight' },
      title: '评分权重',
      width: 135,
    },
    {
      field: 'scoringType',
      minWidth: 170,
      slots: { default: 'scoringType' },
      title: '评分方式',
    },
    {
      field: 'visibleContent',
      minWidth: 160,
      slots: { default: 'visibleContent' },
      title: '可见内容',
    },
    {
      align: 'center',
      field: 'requiredSetting',
      slots: { default: 'requiredSetting' },
      title: '评语必填',
      width: 95,
    },
    {
      align: 'center',
      field: 'rejectAuthority',
      slots: { default: 'rejectAuthority' },
      title: '允许驳回',
      width: 95,
    },
    {
      align: 'center',
      slots: { default: 'actions' },
      title: '操作',
      width: 72,
    },
  ];
}

/** 新增参评员工表单 */
export function useAssessmentAddFormSchema(
  selectableEmployeeIds: Set<number>,
): VbenFormSchema[] {
  return [
    {
      component: markRaw(HrmEmployeeMultiSelect),
      componentProps: {
        enabledIds: [...selectableEmployeeIds],
        placeholder: '请选择未加入当前计划的员工',
        title: '选择参评员工',
      },
      fieldName: 'employeeIds',
      label: '参评员工',
      rules: z
        .array(z.number())
        .min(1, '请选择参评员工')
        .refine(
          (ids) => ids.every((id) => selectableEmployeeIds.has(id)),
          '请选择未加入当前计划的员工',
        ),
    },
  ];
}

export { HrmPerformancePlanStatus };
