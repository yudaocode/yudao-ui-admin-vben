import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ProductUnitApi } from '#/api/basic/productunit';

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
      fieldName: 'groupId',
      label: '分组编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入分组编号',
      },
    },
    {
      fieldName: 'name',
      label: '单位名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单位名称',
      },
    },
    {
      fieldName: 'basic',
      label: '基础单位',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入基础单位',
      },
    },
    {
      fieldName: 'number',
      label: '单位数量/相对于基础单位',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单位数量/相对于基础单位',
      },
    },
    {
      fieldName: 'usageType',
      label: '用途',
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择用途',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'groupId',
      label: '分组编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入分组编号',
      },
    },
    {
      fieldName: 'name',
      label: '单位名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单位名称',
      },
    },
    {
      fieldName: 'basic',
      label: '基础单位',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入基础单位',
      },
    },
    {
      fieldName: 'number',
      label: '单位数量/相对于基础单位',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单位数量/相对于基础单位',
      },
    },
    {
      fieldName: 'usageType',
      label: '用途',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择用途',
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
export function useGridColumns(): VxeTableGridOptions<ProductUnitApi.ProductUnit>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'groupId',
      title: '分组编号',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '单位名称',
      minWidth: 120,
    },
    {
      field: 'basic',
      title: '基础单位',
      minWidth: 120,
    },
    {
      field: 'number',
      title: '单位数量/相对于基础单位',
      minWidth: 120,
    },
    {
      field: 'usageType',
      title: '用途',
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
