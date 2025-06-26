import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { fenToYuan } from '@vben/utils';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'bindUserId',
      label: '推广员编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入推广员编号',
        clearable: true,
      },
    },
    {
      fieldName: 'brokerageEnabled',
      label: '推广资格',
      component: 'Select',
      componentProps: {
        placeholder: '请选择推广资格',
        clearable: true,
        options: [
          { label: '有', value: true },
          { label: '无', value: false },
        ],
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '用户编号',
      minWidth: 80,
    },
    {
      field: 'avatar',
      title: '头像',
      minWidth: 70,
      cellRender: {
        name: 'CellImage',
        props: {
          width: 24,
          height: 24,
          shape: 'circle',
        },
      },
    },
    {
      field: 'nickname',
      title: '昵称',
      minWidth: 80,
    },
    {
      field: 'brokerageUserCount',
      title: '推广人数',
      minWidth: 80,
    },
    {
      field: 'brokerageOrderCount',
      title: '推广订单数量',
      minWidth: 110,
    },
    {
      field: 'brokerageOrderPrice',
      title: '推广订单金额',
      minWidth: 110,
      formatter: ({ row }) => `￥${fenToYuan(row.brokerageOrderPrice)}`,
    },
    {
      field: 'withdrawPrice',
      title: '已提现金额',
      minWidth: 100,
      formatter: ({ row }) => `￥${fenToYuan(row.withdrawPrice)}`,
    },
    {
      field: 'withdrawCount',
      title: '已提现次数',
      minWidth: 100,
    },
    {
      field: 'price',
      title: '未提现金额',
      minWidth: 100,
      formatter: ({ row }) => `￥${fenToYuan(row.price)}`,
    },
    {
      field: 'frozenPrice',
      title: '冻结中佣金',
      minWidth: 100,
      formatter: ({ row }) => `￥${fenToYuan(row.frozenPrice)}`,
    },
    {
      field: 'brokerageEnabled',
      title: '推广资格',
      minWidth: 80,
      slots: { default: 'brokerageEnabled' },
    },
    {
      field: 'brokerageTime',
      title: '成为推广员时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'bindUserId',
      title: '上级推广员编号',
      minWidth: 150,
    },
    {
      field: 'bindUserTime',
      title: '推广员绑定时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
