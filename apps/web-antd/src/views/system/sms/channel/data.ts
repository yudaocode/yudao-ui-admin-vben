import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
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
      componentProps: {
        placeholder: '请输入短信签名',
      },
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '渠道编码',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, 'string'),
        placeholder: '请选择短信渠道',
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
      fieldName: 'apiKey',
      label: '短信 API 的账号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入短信 API 的账号',
      },
      rules: 'required',
    },
    {
      fieldName: 'apiSecret',
      label: '短信 API 的密钥',
      component: 'Input',
      componentProps: {
        placeholder: '请输入短信 API 的密钥',
      },
    },
    {
      fieldName: 'callbackUrl',
      label: '短信发送回调 URL',
      component: 'Input',
      componentProps: {
        placeholder: '请输入短信发送回调 URL',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
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
      componentProps: {
        allowClear: true,
        placeholder: '请输入短信签名',
      },
    },
    {
      fieldName: 'code',
      label: '渠道编码',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, 'string'),
        placeholder: '请选择短信渠道',
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
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'signature',
      title: '短信签名',
    },
    {
      field: 'code',
      title: '渠道编码',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE },
      },
    },
    {
      field: 'status',
      title: '启用状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'apiKey',
      title: '短信 API 的账号',
    },
    {
      field: 'apiSecret',
      title: '短信 API 的密钥',
    },
    {
      field: 'callbackUrl',
      title: '短信发送回调 URL',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
