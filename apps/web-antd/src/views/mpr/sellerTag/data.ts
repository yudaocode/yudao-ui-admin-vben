import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SellerTagApi } from '#/api/mpr/sellerTag';

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
      fieldName: 'sellerId',
      label: '卖家id',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入卖家id',
      },
    },
    {
      fieldName: 'tagId',
      label: '标签id',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标签id',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sellerId',
      label: '卖家id',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入卖家id',
      },
    },
    {
      fieldName: 'tagId',
      label: '标签id',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标签id',
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
export function useGridColumns(): VxeTableGridOptions<SellerTagApi.SellerTag>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'sellerId',
      title: '卖家id',
      minWidth: 120,
    },
    {
      field: 'tagId',
      title: '标签id',
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
