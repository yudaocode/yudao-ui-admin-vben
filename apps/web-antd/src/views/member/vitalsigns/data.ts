import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VitalSignsApi } from '#/api/member/vitalsigns';

import { getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'temperature',
      label: '体温',
      component: 'Input',
      componentProps: {
        placeholder: '请输入体温',
      },
    },
    {
      fieldName: 'pulse',
      label: '心率',
      component: 'Input',
      componentProps: {
        placeholder: '请输入心率',
      },
    },
    {
      fieldName: 'respiration',
      label: '呼吸',
      component: 'Input',
      componentProps: {
        placeholder: '请输入呼吸',
      },
    },
    {
      fieldName: 'systolicPressure',
      label: '高压',
      component: 'Input',
      componentProps: {
        placeholder: '请输入高压',
      },
    },
    {
      fieldName: 'diastolicPressure',
      label: '高压',
      component: 'Input',
      componentProps: {
        placeholder: '请输入高压',
      },
    },
    {
      fieldName: 'pulseOxygenSaturation',
      label: '血氧',
      component: 'Input',
      componentProps: {
        placeholder: '请输入血氧',
      },
    },
    {
      fieldName: 'userId',
      label: '用户编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户编号',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'temperature',
      label: '体温',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入体温',
      },
    },
    {
      fieldName: 'pulse',
      label: '心率',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入心率',
      },
    },
    {
      fieldName: 'respiration',
      label: '呼吸',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入呼吸',
      },
    },
    {
      fieldName: 'systolicPressure',
      label: '高压',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入高压',
      },
    },
    {
      fieldName: 'diastolicPressure',
      label: '高压',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入高压',
      },
    },
    {
      fieldName: 'pulseOxygenSaturation',
      label: '血氧',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入血氧',
      },
    },
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<VitalSignsApi.VitalSigns>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'temperature',
      title: '体温',
      minWidth: 120,
    },
    {
      field: 'pulse',
      title: '心率',
      minWidth: 120,
    },
    {
      field: 'respiration',
      title: '呼吸',
      minWidth: 120,
    },
    {
      field: 'systolicPressure',
      title: '高压',
      minWidth: 120,
    },
    {
      field: 'diastolicPressure',
      title: '高压',
      minWidth: 120,
    },
    {
      field: 'pulseOxygenSaturation',
      title: '血氧',
      minWidth: 120,
    },
    {
      field: 'userId',
      title: '用户编号',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
