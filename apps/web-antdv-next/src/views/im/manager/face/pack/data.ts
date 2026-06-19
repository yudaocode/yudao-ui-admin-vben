import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getRangePickerDefaultProps } from '#/utils';

/** 表情包表单 */
export function usePackFormSchema(): VbenFormSchema[] {
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
      fieldName: 'icon',
      label: '封面',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 1,
      },
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入表情包名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9999,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 表情包搜索表单 */
export function usePackGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '表情包',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入表情包名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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

/** 表情包字段 */
export function usePackGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      field: 'icon',
      title: '封面',
      width: 80,
      slots: { default: 'icon' },
    },
    {
      field: 'name',
      title: '名称',
      minWidth: 140,
    },
    {
      field: 'sort',
      title: '排序',
      width: 80,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 表情表单 */
export function useItemFormSchema(): VbenFormSchema[] {
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
      fieldName: 'packId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'url',
      label: '表情图',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 1,
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '表情名',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入表情名',
      },
    },
    {
      fieldName: 'width',
      label: '宽度',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 2048,
      },
      rules: 'required',
    },
    {
      fieldName: 'height',
      label: '高度',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 2048,
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9999,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 表情搜索表单 */
export function useItemGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '表情名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入表情名',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 表情字段 */
export function useItemGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      width: 80,
    },
    {
      field: 'url',
      title: '表情图',
      width: 80,
      slots: { default: 'image' },
    },
    {
      field: 'name',
      title: '表情名',
      minWidth: 140,
    },
    {
      title: '尺寸',
      width: 120,
      slots: { default: 'size' },
    },
    {
      field: 'sort',
      title: '排序',
      width: 80,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 用户表情搜索表单 */
export function useUserItemGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'InputNumber',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'name',
      label: '表情名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入表情名',
      },
    },
    {
      fieldName: 'createTime',
      label: '添加时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 用户表情字段 */
export function useUserItemGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      field: 'url',
      title: '表情图',
      width: 80,
      slots: { default: 'image' },
    },
    {
      field: 'name',
      title: '表情名',
      minWidth: 140,
    },
    {
      title: '所属用户',
      minWidth: 180,
      slots: { default: 'user' },
    },
    {
      title: '尺寸',
      width: 120,
      slots: { default: 'size' },
    },
    {
      field: 'createTime',
      title: '添加时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
