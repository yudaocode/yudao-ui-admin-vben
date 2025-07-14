import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { fenToYuan, formatDateTime } from '@vben/utils';

import { ElTag } from 'element-plus';

import { getAppList } from '#/api/pay/app';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
        options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE, 'string'),
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
        options: getDictOptions(DICT_TYPE.PAY_REFUND_STATUS, 'number'),
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
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'refundPrice',
      title: '退款金额',
      formatter: 'formatFenToYuanAmount',
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

/** 详情页的字段 */
export function useBaseDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'merchantRefundId',
      label: '商户退款单号',
      content: (data) =>
        h(ElTag, {}, () => {
          return data?.merchantRefundId || '-';
        }),
    },
    {
      field: 'channelRefundNo',
      label: '渠道退款单号',
      content: (data) =>
        h(ElTag, {}, () => {
          return data?.channelRefundNo || '-';
        }),
    },
    {
      field: 'merchantOrderId',
      label: '商户支付单号',
      content: (data) =>
        h(ElTag, {}, () => {
          return data?.merchantOrderId || '-';
        }),
    },
    {
      field: 'channelOrderNo',
      label: '渠道支付单号',
      content: (data) =>
        h(ElTag, {}, () => {
          return data?.channelOrderNo || '-';
        }),
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
      field: 'payPrice',
      label: '支付金额',
      content: (data) =>
        h(ElTag, { color: 'success' }, () => {
          return fenToYuan(data.payPrice || 0);
        }),
    },
    {
      field: 'refundPrice',
      label: '退款金额',
      content: (data) =>
        h(ElTag, { color: 'red' }, () => {
          return fenToYuan(data.refundPrice || 0);
        }),
    },
    {
      field: 'status',
      label: '退款状态',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_REFUND_STATUS,
          value: data?.status,
        }),
    },
    {
      field: 'successTime',
      label: '退款时间',
      content: (data) => formatDateTime(data.successTime) as string,
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data.createTime) as string,
    },
    {
      field: 'updateTime',
      label: '更新时间',
      content: (data) => formatDateTime(data.updateTime) as string,
    },
  ];
}

/** 详情页的字段 */
export function useChannelDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'channelCode',
      label: '退款渠道',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_CHANNEL_CODE,
          value: data?.channelCode,
        }),
    },
    {
      field: 'reason',
      label: '退款原因',
    },
    {
      field: 'userIp',
      label: '退款 IP',
    },
    {
      field: 'notifyUrl',
      label: '通知 URL',
    },
    {
      field: 'channelErrorCode',
      label: '渠道错误码',
    },
    {
      field: 'channelErrorMsg',
      label: '渠道错误码描述',
    },
    {
      field: 'channelNotifyData',
      label: '支付通道异步回调内容',
    },
  ];
}
