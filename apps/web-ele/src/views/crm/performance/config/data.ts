import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { handleTree } from '@vben/utils';

import { PerformanceConfigObjectTypeEnum } from '#/api/crm/performance/config';
import { BizTypeEnum } from '#/api/crm/permission';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';

export const bizTypeOptions = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
];

export const objectTypeOptions = [
  { label: '部门', value: PerformanceConfigObjectTypeEnum.DEPT },
  { label: '员工', value: PerformanceConfigObjectTypeEnum.USER },
];

export const monthFields = [
  { label: '一月', prop: 'januaryTargetPrice' },
  { label: '二月', prop: 'februaryTargetPrice' },
  { label: '三月', prop: 'marchTargetPrice' },
  { label: '四月', prop: 'aprilTargetPrice' },
  { label: '五月', prop: 'mayTargetPrice' },
  { label: '六月', prop: 'juneTargetPrice' },
  { label: '七月', prop: 'julyTargetPrice' },
  { label: '八月', prop: 'augustTargetPrice' },
  { label: '九月', prop: 'septemberTargetPrice' },
  { label: '十月', prop: 'octoberTargetPrice' },
  { label: '十一月', prop: 'novemberTargetPrice' },
  { label: '十二月', prop: 'decemberTargetPrice' },
] as const;

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      label: '年份',
      component: 'DatePicker',
      componentProps: {
        type: 'year',
        format: 'YYYY',
        valueFormat: 'YYYY',
        placeholder: '请选择年份',
      },
      defaultValue: new Date().getFullYear().toString(),
    },
    {
      fieldName: 'bizType',
      label: '目标类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: bizTypeOptions,
        placeholder: '请选择目标类型',
      },
    },
    {
      fieldName: 'objectType',
      label: '对象类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: objectTypeOptions,
        placeholder: '请选择对象类型',
      },
    },
    {
      fieldName: 'deptObjectId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        defaultExpandAll: true,
        placeholder: '请选择部门',
        clearable: true,
      },
      dependencies: {
        triggerFields: ['objectType'],
        show: (values) =>
          values.objectType === PerformanceConfigObjectTypeEnum.DEPT,
      },
    },
    {
      fieldName: 'userObjectId',
      label: '员工',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        allowClear: true,
        filterable: true,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择员工',
      },
      dependencies: {
        triggerFields: ['objectType'],
        show: (values) =>
          values.objectType === PerformanceConfigObjectTypeEnum.USER,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'year', title: '年份', width: 90, fixed: 'left' },
    {
      field: 'objectType',
      title: '对象类型',
      width: 100,
      fixed: 'left',
      slots: { default: 'objectType' },
    },
    {
      field: 'objectName',
      title: '目标对象',
      minWidth: 140,
      fixed: 'left',
    },
    {
      field: 'bizType',
      title: '目标类型',
      width: 100,
      slots: { default: 'bizType' },
    },
    ...monthFields.map((item) => ({
      field: item.prop,
      title: item.label,
      formatter: 'formatAmount2',
      width: 120,
    })),
    {
      field: 'yearTargetPrice',
      title: '年度目标',
      formatter: 'formatAmount2',
      width: 140,
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
      width: 180,
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 获取目标类型名称 */
export function getBizTypeLabel(value: number) {
  return bizTypeOptions.find((item) => item.value === value)?.label || '';
}

/** 获取对象类型名称 */
export function getObjectTypeLabel(value: number) {
  return objectTypeOptions.find((item) => item.value === value)?.label || '';
}
