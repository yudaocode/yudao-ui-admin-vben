import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayRefundApi } from '#/api/pay/refund';

import { useAccess } from '@vben/access';

import { getAppList } from '#/api/pay/app';
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '#/utils/dict';

const { hasAccessByCodes } = useAccess();

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
      component: 'DatePicker',
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = PayRefundApi.Refund>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'payPrice',
      title: '支付金额',
      minWidth: 120,
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'success',
          content: '￥{payPrice}',
          formatter: (value: number) => (value / 100).toFixed(2),
        },
      },
    },
    {
      field: 'refundPrice',
      title: '退款金额',
      minWidth: 120,
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'danger',
          content: '￥{refundPrice}',
          formatter: (value: number) => (value / 100).toFixed(2),
        },
      },
    },
    {
      field: 'merchantRefundId',
      title: '退款订单号',
      minWidth: 300,
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'info',
          content: '商户 {merchantRefundId}',
        },
      },
    },
    {
      field: 'channelRefundNo',
      title: '渠道退款单号',
      minWidth: 200,
      cellRender: {
        name: 'CellTag',
        props: {
          type: 'success',
          content: '{channelRefundNo}',
        },
      },
    },
    {
      field: 'status',
      title: '退款状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_REFUND_STATUS },
      },
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 100,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            show: hasAccessByCodes(['pay:refund:query']),
          },
        ],
      },
    },
  ];
}
