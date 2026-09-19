import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';
import { getStatusOptions } from '#/views/oa/travel/apply/data';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        options: getStatusOptions(),
        allowClear: true,
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择申请部门',
        allowClear: true,
        treeDefaultExpandAll: true,
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
    {
      fieldName: 'payStatus',
      label: '支付状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PAY_STATUS, 'boolean'),
        allowClear: true,
        placeholder: '请选择支付状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '单据编号',
      minWidth: 200,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '单据状态',
      width: 110,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'travelApplyNo',
      title: '关联出差单号',
      minWidth: 200,
    },
    {
      field: 'reason',
      title: '出差事由',
      minWidth: 220,
      showOverflow: 'tooltip',
    },
    {
      field: 'startTime',
      title: '开始日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'totalPrice',
      title: '报销总金额',
      width: 130,
      align: 'right',
    },
    {
      field: 'payStatus',
      title: '支付状态',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PAY_STATUS },
      },
    },
    {
      field: 'creatorName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'deptName',
      title: '申请部门',
      minWidth: 140,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 表单费用明细的列配置 */
export function useItemGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      title: '序号',
      width: 60,
      align: 'center',
    },
    {
      field: 'expenseType',
      title: '费用类型',
      minWidth: 140,
      slots: { default: 'expenseType' },
    },
    {
      field: 'expenseTime',
      title: '发生日期',
      minWidth: 170,
      slots: { default: 'expenseTime' },
    },
    {
      field: 'departureCity',
      title: '出发地',
      minWidth: 160,
      slots: { default: 'departureCity' },
    },
    {
      field: 'arrivalCity',
      title: '到达地',
      minWidth: 160,
      slots: { default: 'arrivalCity' },
    },
    {
      field: 'price',
      title: '金额(元)',
      minWidth: 160,
      align: 'right',
      slots: { default: 'price', header: 'priceHeader' },
    },
    {
      field: 'description',
      title: '费用说明',
      minWidth: 180,
      slots: { default: 'description' },
    },
    {
      title: '操作',
      width: 75,
      fixed: 'right',
      slots: { default: 'itemActions' },
    },
  ];
}

/** 详情费用明细的列配置 */
export function useItemDetailGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      title: '序号',
      width: 60,
      align: 'center',
    },
    {
      field: 'expenseType',
      title: '费用类型',
      width: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_EXPENSE_TYPE },
      },
    },
    {
      field: 'expenseTime',
      title: '发生日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'departureCity',
      title: '出发地',
      minWidth: 150,
    },
    {
      field: 'arrivalCity',
      title: '到达地',
      minWidth: 150,
    },
    {
      field: 'price',
      title: '金额(元)',
      width: 130,
      align: 'right',
    },
    {
      field: 'description',
      title: '费用说明',
      minWidth: 180,
    },
  ];
}
