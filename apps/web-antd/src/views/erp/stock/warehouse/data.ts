import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpWarehouseApi } from '#/api/erp/stock/warehouse';

import { DICT_TYPE, getDictOptions } from '#/utils';

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
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'address',
      label: '仓库地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库地址',
      },
    },
    {
      fieldName: 'status',
      label: '开启状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: 'required',
      defaultValue: 0,
    },
    {
      fieldName: 'warehousePrice',
      label: '仓储费(元)',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入仓储费，单位：元/天/KG',
        min: 0,
        precision: 2,
        class: 'w-full',
      },
    },
    {
      fieldName: 'truckagePrice',
      label: '搬运费(元)',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入搬运费，单位：元',
        min: 0,
        precision: 2,
        class: 'w-full',
      },
    },
    {
      fieldName: 'principal',
      label: '负责人',
      component: 'Input',
      componentProps: {
        placeholder: '请输入负责人',
      },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入排序',
        precision: 0,
        class: 'w-full',
      },
      rules: 'required',
      defaultValue: 0,
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '仓库名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入仓库名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '仓库状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择仓库状态',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = ErpWarehouseApi.Warehouse>(
  onDefaultStatusChange?: (
    newStatus: boolean,
    row: T,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '仓库名称',
      minWidth: 150,
    },
    {
      field: 'address',
      title: '仓库地址',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'warehousePrice',
      title: '仓储费(元)',
      width: 120,
      cellRender: {
        name: 'CellMoney',
      },
    },
    {
      field: 'truckagePrice',
      title: '搬运费(元)',
      width: 120,
      cellRender: {
        name: 'CellMoney',
      },
    },
    {
      field: 'principal',
      title: '负责人',
      width: 100,
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
      field: 'defaultStatus',
      title: '是否默认',
      width: 100,
      cellRender: {
        attrs: { beforeChange: onDefaultStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: true,
          unCheckedValue: false,
        },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      showOverflow: 'tooltip',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      cellRender: {
        name: 'CellDateTime',
      },
    },
    {
      field: 'actions',
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
