import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { DICT_TYPE } from '@vben/constants';

/** 档案员工列表搜索 */
export function useArchiveGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '员工',
      component: 'Input',
      componentProps: {
        placeholder: '请输入员工姓名或工号',
        allowClear: true,
      },
    },
  ];
}

/** 档案员工列表列 */
export function useArchiveGridColumns(): VxeTableGridOptions<HrmPerformanceAssessmentApi.PerformanceArchiveEmployee>['columns'] {
  return [
    { type: 'checkbox' as const, width: 46 },
    {
      field: 'employeeName',
      title: '员工姓名',
      minWidth: 130,
      fixed: 'left',
      slots: { default: 'employeeName' },
    },
    { field: 'jobNumber', title: '工号', minWidth: 120 },
    { field: 'deptName', title: '部门', minWidth: 120 },
    { field: 'postName', title: '职位', minWidth: 130 },
    { field: 'mobile', title: '手机号', width: 130 },
    {
      field: 'employeeStatus',
      title: '员工状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_STATUS },
      },
    },
    { field: 'latestPlanName', title: '最近考核计划', minWidth: 180 },
    {
      field: 'latestScore',
      title: '最近绩效评分',
      width: 120,
      align: 'center',
    },
    {
      field: 'latestResultLevel',
      title: '最近绩效等级',
      width: 120,
      align: 'center',
    },
    {
      field: 'assessmentCount',
      title: '考核次数',
      width: 100,
      align: 'center',
    },
  ];
}

/** 员工历史考核列表列 */
export function useEmployeeArchiveGridColumns(): VxeTableGridOptions<HrmPerformanceAssessmentApi.PerformanceAssessment>['columns'] {
  return [
    { type: 'checkbox' as const, width: 46 },
    {
      field: 'name',
      title: '方案名称',
      minWidth: 180,
      slots: { default: 'planName' },
    },
    { field: 'cycle', title: '考核周期', width: 120 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      formatter: () => '已归档',
    },
    { field: 'score', title: '评分', width: 100, align: 'center' },
    { field: 'resultLevel', title: '结果', width: 100, align: 'center' },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 员工历史筛选 */
export function useEmployeeArchiveFormSchema(
  planOptions: { label: string; value: number }[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'planId',
      label: '考核计划',
      component: 'Select',
      componentProps: {
        options: planOptions,
        placeholder: '请选择考核计划',
        allowClear: true,
      },
    },
  ];
}
