import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayOrderApi } from '#/api/pay/order';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

import { ElTag } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'appId',
      label: '应用编号',
      componentProps: {
        placeholder: '请输入应用编号',
      },
    },
    {
      component: 'Select',
      fieldName: 'channelCode',
      label: '支付渠道',
      componentProps: {
        placeholder: '请选择开启状态',
        options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE, 'string'),
      },
    },
    {
      component: 'Input',
      fieldName: 'merchantOrderId',
      label: '商户单号',
      componentProps: {
        placeholder: '请输入商户单号',
      },
    },
    {
      component: 'Input',
      fieldName: 'no',
      label: '支付单号',
      componentProps: {
        placeholder: '请输入支付单号',
      },
    },
    {
      component: 'Input',
      fieldName: 'channelOrderNo',
      label: '渠道单号',
      componentProps: {
        placeholder: '请输入渠道单号',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '支付状态',
      componentProps: {
        placeholder: '请选择支付状态',
        options: getDictOptions(DICT_TYPE.PAY_ORDER_STATUS, 'number'),
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: '创建时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 60 },
    {
      title: '编号',
      field: 'id',
    },
    {
      title: '支付金额',
      field: 'price',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '退款金额',
      field: 'refundPrice',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '手续金额',
      field: 'channelFeePrice',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '订单号',
      field: 'no',
      slots: {
        default: 'no',
      },
    },
    {
      title: '支付状态',
      field: 'status',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_ORDER_STATUS },
      },
    },
    {
      title: '支付渠道',
      field: 'channelCode',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_CHANNEL_CODE },
      },
    },
    {
      title: '支付时间',
      field: 'successTime',
      formatter: 'formatDateTime',
    },
    {
      title: '支付应用',
      field: 'appName',
    },
    {
      title: '商品标题',
      field: 'subject',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'merchantOrderId',
      label: '商户单号',
    },
    {
      field: 'no',
      label: '支付单号',
    },
    {
      field: 'appId',
      label: '应用编号',
    },
    {
      field: 'appName',
      label: '应用名称',
    },
    {
      field: 'status',
      label: '支付状态',
      content: (data: PayOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_ORDER_STATUS,
          value: data?.status,
        }),
    },
    {
      field: 'price',
      label: '支付金额',
      content: (data: PayOrderApi.Order) =>
        `￥${erpPriceInputFormatter(data?.price)}`,
    },
    {
      field: 'channelFeePrice',
      label: '手续费',
      content: (data: PayOrderApi.Order) =>
        `￥${erpPriceInputFormatter(data?.channelFeePrice)}`,
    },
    {
      field: 'channelFeeRate',
      label: '手续费比例',
      content: (data: PayOrderApi.Order) =>
        `${erpPriceInputFormatter(data?.channelFeeRate)}%`,
    },
    {
      field: 'successTime',
      label: '支付时间',
      content: (data: PayOrderApi.Order) =>
        formatDateTime(data?.successTime) as string,
    },
    {
      field: 'expireTime',
      label: '失效时间',
      content: (data: PayOrderApi.Order) =>
        formatDateTime(data?.expireTime) as string,
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data: PayOrderApi.Order) =>
        formatDateTime(data?.createTime) as string,
    },
    {
      field: 'updateTime',
      label: '更新时间',
      content: (data: PayOrderApi.Order) =>
        formatDateTime(data?.updateTime) as string,
    },
    {
      field: 'subject',
      label: '商品标题',
    },
    {
      field: 'body',
      label: '商品描述',
    },
    {
      field: 'channelCode',
      label: '支付渠道',
      content: (data: PayOrderApi.Order) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_CHANNEL_CODE,
          value: data?.channelCode,
        }),
    },
    {
      field: 'userIp',
      label: '支付 IP',
    },
    {
      field: 'channelOrderNo',
      label: '渠道单号',
      content: (data: PayOrderApi.Order) =>
        h(ElTag, { color: 'green' }, () => data?.channelOrderNo || ''),
    },
    {
      field: 'channelUserId',
      label: '渠道用户',
    },
    {
      field: 'refundPrice',
      label: '退款金额',
      content: (data: PayOrderApi.Order) =>
        `￥${erpPriceInputFormatter(data?.refundPrice)}`,
    },
    {
      field: 'notifyUrl',
      label: '通知 URL',
    },
    {
      field: 'channelNotifyData',
      label: '支付通道异步回调内容',
    },
  ];
}
