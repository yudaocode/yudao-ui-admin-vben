import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

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
        allowClear: true,
      },
    },
    {
      fieldName: 'brokerageEnabled',
      label: '推广资格',
      component: 'Select',
      componentProps: {
        placeholder: '请选择推广资格',
        allowClear: true,
        options: [
          { label: '有', value: true },
          { label: '无', value: false },
        ],
      },
      defaultValue: true,
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
export function useGridColumns<T = MallBrokerageUserApi.BrokerageUser>(
  onBrokerageEnabledChange?: (
    newEnabled: boolean,
    row: T,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
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
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onBrokerageEnabledChange },
        name: 'CellSwitch',
        props: {
          checkedValue: true,
          uncheckedValue: false,
          checkedChildren: '有',
          unCheckedChildren: '无',
        },
      },
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

/** 创建分销员表单配置 */
export function useCreateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '分销员编号',
      component: 'InputSearch',
      rules: 'required',
    },
    {
      fieldName: 'bindUserId',
      label: '上级推广员编号',
      component: 'InputSearch',
      rules: 'required',
    },
  ];
}
