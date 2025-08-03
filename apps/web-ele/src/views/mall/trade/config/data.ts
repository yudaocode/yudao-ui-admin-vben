import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE, getDictOptions } from '#/utils';

/** 售后表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'type',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'afterSaleRefundReasons',
      label: '退款理由',
      component: 'Select',
      componentProps: {
        placeholder: '请直接输入退款理由',
        multiple: true,
        options: [],
        class: 'w-full',
        allowCreate: true,
        filterable: true,
        reserveKeyword: false,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'afterSale',
      },
    },
    {
      fieldName: 'afterSaleReturnReasons',
      label: '退货理由',
      component: 'Select',
      componentProps: {
        placeholder: '请直接输入退货理由',
        multiple: true,
        options: [],
        class: 'w-full',
        allowCreate: true,
        filterable: true,
        reserveKeyword: false,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'afterSale',
      },
    },
    {
      fieldName: 'deliveryExpressFreeEnabled',
      label: '启用包邮',
      component: 'Switch',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'delivery',
      },
      description: '商城是否启用全场包邮',
    },
    {
      fieldName: 'deliveryExpressFreePrice',
      label: '满额包邮',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'delivery',
      },
      description: '商城商品满多少金额即可包邮，单位：元',
    },
    {
      fieldName: 'deliveryPickUpEnabled',
      label: '启用门店自提',
      component: 'Switch',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'delivery',
      },
    },
    {
      fieldName: 'brokerageEnabled',
      label: '启用分佣',
      component: 'Switch',
      description: '商城是否开启分销模式',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
    },
    {
      fieldName: 'brokerageEnabledCondition',
      label: '分佣模式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BROKERAGE_ENABLED_CONDITION,
          'number',
        ),
        buttonStyle: 'solid',
        optionType: 'button',
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description:
        '人人分销：每个用户都可以成为推广员 \n 单级分销：每个用户只能有一个上级推广员',
    },
    {
      fieldName: 'brokerageBindMode',
      label: '分销关系绑定',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.BROKERAGE_BIND_MODE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description:
        '首次绑定：只要用户没有推广人，随时都可以绑定推广关系 \n 注册绑定：只有新用户注册时或首次进入系统时才可以绑定推广关系',
    },
    {
      fieldName: 'brokeragePosterUrls',
      label: '分销海报图',
      component: 'ImageUpload',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description: '个人中心分销海报图片，建议尺寸 600x1000',
    },
    {
      fieldName: 'brokerageFirstPercent',
      label: '一级返佣比例',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description: '订单交易成功后给推广人返佣的百分比',
    },
    {
      fieldName: 'brokerageSecondPercent',
      label: '二级返佣比例',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description: '订单交易成功后给推广人的推荐人返佣的百分比',
    },
    {
      fieldName: 'brokerageFrozenDays',
      label: '佣金冻结天数',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description:
        '防止用户退款，佣金被提现了，所以需要设置佣金冻结时间，单位：天',
    },
    {
      fieldName: 'brokerageWithdrawMinPrice',
      label: '提现最低金额',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description: '用户提现最低金额限制，单位：元',
    },
    {
      fieldName: 'brokerageWithdrawFeePercent',
      label: '提现手续费',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description:
        '提现手续费百分比，范围 0-100，0 为无提现手续费。例：设置 10，即收取 10% 手续费，提现10 元，到账 9 元，1 元手续费',
    },
    {
      fieldName: 'brokerageWithdrawTypes',
      label: '提现方式',
      component: 'CheckboxGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE, 'number'),
        class: 'w-full',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 'brokerage',
      },
      description: '商城开通提现的付款方式',
    },
  ];
}
