import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 发放的表单 */
export function useIssueFormSchema(): VbenFormSchema[] {
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
      fieldName: 'itemName',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'applyQuantity',
      label: '申请数量',
      component: 'InputNumber',
      componentProps: {
        disabled: true,
        precision: 0,
      },
    },
    {
      fieldName: 'issuedQuantity',
      label: '实发数量',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        placeholder: '请输入实发数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'issueRemark',
      label: '发放备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        placeholder: '请输入发放备注',
      },
    },
  ];
}

/** 归还的表单 */
export function useReturnFormSchema(): VbenFormSchema[] {
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
      fieldName: 'itemName',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'issuedQuantity',
      label: '实发数量',
      component: 'InputNumber',
      componentProps: {
        disabled: true,
        precision: 0,
      },
    },
    {
      fieldName: 'returnedQuantity',
      label: '已归还数量',
      component: 'InputNumber',
      componentProps: {
        disabled: true,
        precision: 0,
      },
    },
    {
      fieldName: 'quantity',
      label: '本次归还',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        placeholder: '请输入归还数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'returnRemark',
      label: '归还备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        placeholder: '请输入归还备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemName',
      label: '物品名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入物品名称',
      },
    },
    {
      fieldName: 'creatorName',
      label: '申请人',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入申请人',
      },
    },
    {
      fieldName: 'manageType',
      label: '管理类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择管理类型',
      },
    },
    {
      fieldName: 'useType',
      label: '使用类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_USE_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择使用类型',
      },
    },
    {
      fieldName: 'createTime',
      label: '申请时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '申请单号',
      minWidth: 160,
    },
    {
      field: 'creatorName',
      title: '申请人',
      minWidth: 100,
    },
    {
      field: 'deptName',
      title: '申请部门',
      minWidth: 120,
    },
    {
      field: 'useType',
      title: '使用类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_USE_TYPE },
      },
    },
    {
      field: 'itemName',
      title: '物品名称',
      minWidth: 140,
    },
    {
      field: 'model',
      title: '规格型号',
      minWidth: 100,
    },
    {
      field: 'unit',
      title: '计量单位',
      width: 80,
      align: 'center',
    },
    {
      field: 'manageType',
      title: '管理类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_MANAGE_TYPE },
      },
    },
    {
      field: 'applyQuantity',
      title: '申请数量',
      width: 90,
      align: 'center',
    },
    {
      field: 'issuedQuantity',
      title: '实发数量',
      width: 90,
      align: 'center',
    },
    {
      field: 'returnedQuantity',
      title: '已归还',
      width: 90,
      align: 'center',
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_ITEM_STATUS },
      },
    },
    {
      field: 'issueUserName',
      title: '发放人',
      minWidth: 100,
    },
    {
      field: 'issueTime',
      title: '发放时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
