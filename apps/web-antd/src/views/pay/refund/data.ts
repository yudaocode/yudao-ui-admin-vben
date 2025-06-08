import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getAppList } from '#/api/pay/app';
import {
  DICT_TYPE,
  getIntDictOptions,
  getRangePickerDefaultProps,
  getStrDictOptions,
} from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'appId',
      label: '应用编号',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const data = await getAppList();
          return data.map((item) => ({
            label: item.name,
            value: item.id,
          }));
        },
        autoSelect: 'first',
        placeholder: '请选择数据源',
      },
    },
    {
      fieldName: 'channelCode',
      label: '退款渠道',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE),
      },
    },
    {
      fieldName: 'merchantOrderId',
      label: '商户支付单号',
      component: 'Input',
    },
    {
      fieldName: 'merchantRefundId',
      label: '商户退款单号',
      component: 'Input',
    },
    {
      fieldName: 'channelOrderNo',
      label: '渠道支付单号',
      component: 'Input',
    },
    {
      fieldName: 'channelRefundNo',
      label: '渠道退款单号',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '退款状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getIntDictOptions(DICT_TYPE.PAY_REFUND_STATUS),
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
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'merchantRefundId',
      title: '退款订单号',
    },
    {
      field: 'channelRefundNo',
      title: '渠道退款单号',
    },
    {
      field: 'payPrice',
      title: '支付金额',
      formatter: 'formatAmount2',
    },
    {
      field: 'refundPrice',
      title: '退款金额',
      formatter: 'formatAmount2',
    },
    {
      field: 'status',
      title: '退款状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_REFUND_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
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
