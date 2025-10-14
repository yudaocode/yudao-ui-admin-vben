import type { MallOrderApi } from '#/api/mall/trade/order';
import type { DescriptionItemSchema } from '#/components/description';
import type { VxeGridPropTypes } from 'vxe-table';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { fenToYuan, formatDate } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';

/** 订单基础信息 schema */
export function useOrderInfoSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '订单号',
    },
    {
      field: 'user.nickname',
      label: '买家',
    },
    {
      field: 'type',
      label: '订单类型',
      content: (data: MallOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.TRADE_ORDER_TYPE,
          value: data?.type,
        }),
    },
    {
      field: 'terminal',
      label: '订单来源',
      content: (data: MallOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.TERMINAL,
          value: data?.terminal,
        }),
    },
    {
      field: 'userRemark',
      label: '买家留言',
    },
    {
      field: 'remark',
      label: '商家备注',
    },
    {
      field: 'payOrderId',
      label: '支付单号',
    },
    {
      field: 'payChannelCode',
      label: '付款方式',
      content: (data: MallOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_CHANNEL_CODE,
          value: data?.payChannelCode,
        }),
    },
    {
      field: 'brokerageUser.nickname',
      label: '推广用户',
    },
  ];
}

/** 订单状态信息 schema */
export function useOrderStatusSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'status',
      label: '订单状态',
      content: (data: MallOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.TRADE_ORDER_STATUS,
          value: data?.status,
        }),
    },
    {
      field: 'reminder',
      label: '提醒',
      content: () =>
        h('div', { class: 'text-red-500 space-y-1' }, [
          h('div', '买家付款成功后，货款将直接进入您的商户号（微信、支付宝）'),
          h('div', '请及时关注你发出的包裹状态，确保可以配送至买家手中'),
          h('div', '如果买家表示没收到货或货物有问题，请及时联系买家处理，友好协商'),
        ]),
    },
  ];
}

/** 订单金额信息 schema */
export function useOrderPriceSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'totalPrice',
      label: '商品总额',
      content: (data: MallOrderApi.Order) => `${fenToYuan(data?.totalPrice ?? 0)} 元`,
    },
    {
      field: 'deliveryPrice',
      label: '运费金额',
      content: (data: MallOrderApi.Order) => `${fenToYuan(data?.deliveryPrice ?? 0)} 元`,
    },
    {
      field: 'adjustPrice',
      label: '订单调价',
      content: (data: MallOrderApi.Order) => `${fenToYuan(data?.adjustPrice ?? 0)} 元`,
    },
    {
      field: 'couponPrice',
      label: '优惠劵优惠',
      content: (data: MallOrderApi.Order) =>
        h('span', { class: 'text-red-500' }, `${fenToYuan(data?.couponPrice ?? 0)} 元`),
    },
    {
      field: 'vipPrice',
      label: 'VIP 优惠',
      content: (data: MallOrderApi.Order) =>
        h('span', { class: 'text-red-500' }, `${fenToYuan(data?.vipPrice ?? 0)} 元`),
    },
    {
      field: 'discountPrice',
      label: '活动优惠',
      content: (data: MallOrderApi.Order) =>
        h('span', { class: 'text-red-500' }, `${fenToYuan(data?.discountPrice ?? 0)} 元`),
    },
    {
      field: 'pointPrice',
      label: '积分抵扣',
      content: (data: MallOrderApi.Order) =>
        h('span', { class: 'text-red-500' }, `${fenToYuan(data?.pointPrice ?? 0)} 元`),
    },
    {
      field: 'payPrice',
      label: '应付金额',
      content: (data: MallOrderApi.Order) => `${fenToYuan(data?.payPrice ?? 0)} 元`,
    },
  ];
}

/** 收货信息 schema */
export function useDeliveryInfoSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'deliveryType',
      label: '配送方式',
      content: (data: MallOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.TRADE_DELIVERY_TYPE,
          value: data?.deliveryType,
        }),
    },
    {
      field: 'receiverName',
      label: '收货人',
    },
    {
      field: 'receiverMobile',
      label: '联系电话',
    },
    {
      field: 'receiverAddress',
      label: '收货地址',
      content: (data: MallOrderApi.Order) =>
        `${data?.receiverAreaName} ${data?.receiverDetailAddress}`.trim(),
    },
    {
      field: 'logisticsTime',
      label: '发货时间',
      content: (data: MallOrderApi.Order) => formatDate(data?.deliveryTime) as string,
    },
  ];
}

/** 商品信息 columns */
export function useProductColumns(): VxeGridPropTypes.Columns {
  return [
    {
      type: 'seq',
      width: 60,
      title: '序号',
    },
    {
      field: 'spuName',
      title: '商品',
      minWidth: 300,
      slots: { default: 'spuName' },
    },
    {
      field: 'price',
      title: '商品原价',
      width: 150,
      formatter: ({ cellValue }: any) => `${fenToYuan(cellValue)} 元`,
    },
    {
      field: 'count',
      title: '数量',
      width: 100,
    },
    {
      field: 'payPrice',
      title: '合计',
      width: 150,
      formatter: ({ cellValue }: any) => `${fenToYuan(cellValue)} 元`,
    },
    {
      field: 'afterSaleStatus',
      title: '售后状态',
      width: 120,
      slots: { default: 'afterSaleStatus' },
    },
  ];
}

/** 操作日志 columns */
export function useOperateLogColumns(): VxeGridPropTypes.Columns {
  return [
    {
      field: 'createTime',
      title: '操作时间',
      width: 180,
      formatter: ({ cellValue }: any) => formatDate(cellValue) as string,
    },
    {
      field: 'userType',
      title: '操作人',
      width: 100,
      slots: { default: 'userType' },
    },
    {
      field: 'content',
      title: '操作内容',
      minWidth: 200,
    },
  ];
}