import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

import { ElTag } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '转账单号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入转账单号',
      },
    },
    {
      fieldName: 'channelCode',
      label: '转账渠道',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE),
        allowClear: true,
        placeholder: '请选择支付渠道',
      },
    },
    {
      fieldName: 'merchantTransferId',
      label: '商户单号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商户单号',
      },
    },
    {
      fieldName: 'type',
      label: '类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PAY_TRANSFER_TYPE),
        allowClear: true,
        placeholder: '请选择类型',
      },
    },
    {
      fieldName: 'status',
      label: '转账状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PAY_TRANSFER_STATUS),
        allowClear: true,
        placeholder: '请选择转账状态',
      },
    },
    {
      fieldName: 'userName',
      label: '收款人姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入收款人姓名',
      },
    },
    {
      fieldName: 'accountNo',
      label: '收款人账号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入收款人账号',
      },
    },
    {
      fieldName: 'channelTransferNo',
      label: '渠道单号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入渠道单号',
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
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'appName',
      title: '支付应用',
    },
    {
      field: 'price',
      title: '转账金额',
      formatter: 'formatFenToYuanAmount',
    },
    {
      field: 'status',
      title: '转账状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_TRANSFER_STATUS },
      },
    },
    {
      field: 'type',
      title: '类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_TRANSFER_TYPE },
      },
    },
    {
      field: 'channelCode',
      title: '支付渠道',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_CHANNEL_CODE },
      },
    },
    {
      field: 'merchantTransferId',
      title: '商户单号',
    },
    {
      field: 'channelTransferNo',
      title: '渠道单号',
    },
    {
      field: 'userName',
      title: '收款人姓名',
    },
    {
      field: 'accountNo',
      title: '收款人账号',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情的配置 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: '编号',
    },
    {
      field: 'merchantTransferId',
      label: '商户单号',
      content: (data) => {
        return h(ElTag, {
          color: 'blue',
          content: data?.merchantTransferId,
        });
      },
    },
    {
      field: 'no',
      label: '转账单号',
      content: (data) => {
        return h(ElTag, {
          color: 'blue',
          content: data?.no,
        });
      },
    },
    {
      field: 'appId',
      label: '应用编号',
    },
    {
      field: 'status',
      label: '转账状态',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_TRANSFER_STATUS,
          value: data?.status,
        }),
    },
    {
      field: 'price',
      label: '转账金额',
      content: (data) => {
        return h(ElTag, {
          color: 'blue',
          content: `￥${erpPriceInputFormatter(data?.price)}`,
        });
      },
    },
    {
      field: 'successTime',
      label: '转账时间',
      content: (data) => formatDateTime(data?.successTime) as string,
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
    {
      field: 'userName',
      label: '收款人姓名',
    },
    {
      field: 'userAccount',
      label: '收款人账号',
    },
    {
      field: 'channelCode',
      label: '支付渠道',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.PAY_CHANNEL_CODE,
          value: data?.channelCode,
        }),
    },
    {
      field: 'channelCode',
      label: '支付 IP',
    },
    {
      field: 'channelTransferNo',
      label: '渠道单号',
      content: (data) => {
        return h(ElTag, {
          color: 'blue',
          content: data?.channelTransferNo,
        });
      },
    },
    {
      field: 'notifyUrl',
      label: '通知 URL',
    },
    {
      field: 'channelNotifyData',
      label: '转账渠道通知内容',
    },
  ];
}
