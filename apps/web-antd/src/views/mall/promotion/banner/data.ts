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
      fieldName: 'title',
      label: 'Banner标题',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'picUrl',
      label: '图片地址',
      component: 'ImageUpload',
      rules: 'required',
    },
    {
      fieldName: 'position',
      label: '定位',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PROMOTION_BANNER_POSITION, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'url',
      label: '跳转地址',
      component: 'Input',
      rules: 'required',
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
    {
      fieldName: 'memo',
      label: '描述',
      component: 'Textarea',
      componentProps: {
        rows: 4,
        placeholder: '请输入描述',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: 'Banner标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入Banner标题',
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
      title: 'Banner标题',
      field: 'title',
    },
    {
      title: '图片',
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
      title: '定位',
      field: 'position',
      width: 150,
      cellRender: {
        name: 'CellDictTag',
        props: {
          dictType: DICT_TYPE.PROMOTION_BANNER_POSITION,
        },
      },
    },
    {
      title: '跳转地址',
      field: 'url',
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '排序',
      field: 'sort',
      width: 100,
    },
    {
      title: '描述',
      field: 'memo',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
