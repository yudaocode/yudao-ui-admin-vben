import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ServiceAreaApi } from '#/api/mpr/serviceArea';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'country',
      label: '国家代码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入国家代码',
      },
    },
    {
      fieldName: 'location',
      label: '位置',
      component: 'Input',
      componentProps: {
        placeholder: '请输入位置',
      },
    },
    {
      fieldName: 'city',
      label: '城市',
      component: 'Input',
      componentProps: {
        placeholder: '请输入城市',
      },
    },
    {
      fieldName: 'state',
      label: '省份/州缩写',
      component: 'Input',
      componentProps: {
        placeholder: '请输入省份/州缩写',
      },
    },
    {
      fieldName: 'cityId',
      label: '城市ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入城市ID',
      },
    },
    {
      fieldName: 'coordinate',
      label: '坐标',
      component: 'Input',
      componentProps: {
        placeholder: '请输入坐标',
      },
    },
    {
      fieldName: 'currency',
      label: '货币',
      component: 'Input',
      componentProps: {
        placeholder: '请输入货币',
      },
    },
    {
      fieldName: 'description',
      label: '说明',
      component: 'RichTextarea',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'country',
      label: '国家代码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入国家代码',
      },
    },
    {
      fieldName: 'location',
      label: '位置',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入位置',
      },
    },
    {
      fieldName: 'city',
      label: '城市',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入城市',
      },
    },
    {
      fieldName: 'state',
      label: '省份/州缩写',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入省份/州缩写',
      },
    },
    {
      fieldName: 'cityId',
      label: '城市ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入城市ID',
      },
    },
    {
      fieldName: 'coordinate',
      label: '坐标',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入坐标',
      },
    },
    {
      fieldName: 'currency',
      label: '货币',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入货币',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'boolean'),
        placeholder: '请选择状态',
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
export function useGridColumns(): VxeTableGridOptions<ServiceAreaApi.ServiceArea>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'country',
      title: '国家代码',
      minWidth: 120,
    },
    {
      field: 'location',
      title: '位置',
      minWidth: 120,
    },
    {
      field: 'city',
      title: '城市',
      minWidth: 120,
    },
    {
      field: 'state',
      title: '省份/州缩写',
      minWidth: 120,
    },
    {
      field: 'cityId',
      title: '城市ID',
      minWidth: 120,
    },
    {
      field: 'coordinate',
      title: '坐标',
      minWidth: 120,
    },
    {
      field: 'currency',
      title: '货币',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
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
