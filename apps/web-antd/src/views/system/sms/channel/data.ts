import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSmsChannelApi } from '#/api/system/sms/channel';

import { z } from '#/adapter/form';
import { CommonStatusEnum } from '#/utils/constants';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      label: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'signature',
      label: '短信签名',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '渠道编码',
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, 'string'),
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '启用状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
    },
    {
      fieldName: 'apiKey',
      label: '短信 API 的账号',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'apiSecret',
      label: '短信 API 的密钥',
      component: 'Input',
    },
    {
      fieldName: 'callbackUrl',
      label: '短信发送回调 URL',
      component: 'Input',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'signature',
      label: '短信签名',
      component: 'Input',
    },
    {
      fieldName: 'code',
      label: '渠道编码',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, 'string'),
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemSmsChannelApi.SmsChannelVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'signature',
      title: '短信签名',
      minWidth: 120,
    },
    {
      field: 'code',
      title: '渠道编码',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE },
      },
    },
    {
      field: 'status',
      title: '启用状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'apiKey',
      title: '短信 API 的账号',
      minWidth: 180,
    },
    {
      field: 'apiSecret',
      title: '短信 API 的密钥',
      minWidth: 180,
    },
    {
      field: 'callbackUrl',
      title: '短信发送回调 URL',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 180,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'signature',
          nameTitle: '短信渠道',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
    },
  ];
}
