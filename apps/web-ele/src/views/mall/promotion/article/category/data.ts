import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'picUrl',
      label: '图标地址',
      component: 'ImageUpload',
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入排序',
      },
      rules: 'required',
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
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '分类名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入分类名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      title: '编号',
      field: 'id',
      width: 100,
    },
    {
      title: '分类名称',
      field: 'name',
      minWidth: 240,
    },
    {
      title: '分类图片',
      field: 'picUrl',
      width: 80,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      title: '状态',
      field: 'status',
      width: 150,
      cellRender: {
        name: 'CellDictTag',
        props: {
          dictType: DICT_TYPE.COMMON_STATUS,
        },
      },
    },
    {
      title: '排序',
      field: 'sort',
      width: 150,
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
