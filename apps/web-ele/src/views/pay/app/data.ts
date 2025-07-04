import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PayAppApi } from '#/api/pay/app';

import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '应用名',
      componentProps: {
        placeholder: '请输入应用名',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '开启状态',
      componentProps: {
        placeholder: '请选择开启状态',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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

export function useGridColumns<T = PayAppApi.App>(
  onStatusChange?: (
    newStatus: number,
    row: T,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 60 },
    {
      title: '应用标识',
      field: 'appKey',
    },
    {
      title: '应用名',
      field: 'name',
    },
    {
      field: 'status',
      title: '状态',
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
          inlinePrompt: true,
        },
      },
    },
    {
      title: '支付宝配置',
      children: [
        {
          title: 'APP 支付',
          slots: {
            default: 'alipayAppConfig',
          },
        },
        {
          title: 'PC 网站支付',
          slots: {
            default: 'alipayPCConfig',
          },
        },
        {
          title: 'WAP 网站支付',
          slots: {
            default: 'alipayWAPConfig',
          },
        },
        {
          title: '扫码支付',
          slots: {
            default: 'alipayQrConfig',
          },
        },
        {
          title: '条码支付',
          slots: {
            default: 'alipayBarConfig',
          },
        },
      ],
    },
    {
      title: '微信配置',
      children: [
        {
          title: '小程序支付',
          slots: {
            default: 'wxLiteConfig',
          },
        },
        {
          title: 'JSAPI 支付',
          slots: {
            default: 'wxPubConfig',
          },
        },
        {
          title: 'APP 支付',
          slots: {
            default: 'wxAppConfig',
          },
        },
        {
          title: 'Native 支付',
          slots: {
            default: 'wxNativeConfig',
          },
        },
        {
          title: 'WAP 网站支付',
          slots: {
            default: 'wxWapConfig',
          },
        },
        {
          title: '条码支付',
          slots: {
            default: 'wxBarConfig',
          },
        },
      ],
    },
    {
      title: '钱包支付配置',
      field: 'walletConfig',
      slots: {
        default: 'walletConfig',
      },
    },
    {
      title: '模拟支付配置',
      field: 'mockConfig',
      slots: {
        default: 'mockConfig',
      },
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      label: '应用编号',
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
    },
    {
      label: '应用名',
      fieldName: 'name',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入应用名',
      },
    },
    {
      label: '应用标识',
      fieldName: 'appKey',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入应用标识',
      },
    },
    {
      label: '开启状态',
      fieldName: 'status',
      component: 'RadioGroup',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
    {
      label: '支付结果的回调地址',
      fieldName: 'orderNotifyUrl',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入支付结果的回调地址',
      },
    },
    {
      label: '退款结果的回调地址',
      fieldName: 'refundNotifyUrl',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入支付结果的回调地址',
      },
    },
    {
      label: '转账结果的回调地址',
      fieldName: 'transferNotifyUrl',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入转账结果的回调地址',
      },
    },
    {
      label: '备注',
      fieldName: 'remark',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入备注',
      },
    },
  ];
}
