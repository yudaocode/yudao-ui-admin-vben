import type { FormSchemaGetter } from '#/adapter/form';

import { DICT_TYPE, getDictOptions } from '#/utils/dict';

export const modalAliPaySchema: FormSchemaGetter = () => [
  {
    label: '商户编号',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '应用编号',
    fieldName: 'appId',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道编码',
    fieldName: 'code',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道费率',
    fieldName: 'feeRate',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入渠道费率',
    },
  },
  {
    label: '开放平台 APPID',
    fieldName: 'config.appId',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入开放平台 APPID',
    },
  },
  {
    label: '渠道状态',
    fieldName: 'status',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
    },
    defaultValue: 1,
  },
  {
    label: '网关地址',
    fieldName: 'config.serverUrl',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: [
        {
          value: 'https://openapi.alipay.com/gateway.do',
          label: '线上环境',
        },
        {
          value: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
          label: '沙箱环境',
        },
      ],
    },
  },
  {
    label: '算法类型',
    fieldName: 'config.signType',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: [
        {
          value: 'RSA2',
          label: 'RSA2',
        },
      ],
    },
    defaultValue: 'RSA2',
  },
  {
    label: '公钥类型',
    fieldName: 'config.mode',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: [
        {
          value: 0,
          label: '公钥模式',
        },
        {
          value: 1,
          label: '证书模式',
        },
      ],
    },
  },
  {
    label: '应用私钥',
    fieldName: 'config.privateKey',
    component: 'Textarea',
    rules: 'required',
    componentProps: {
      placeholder: '请输入应用私钥',
      rows: 8,
    },
    dependencies: {
      show(values) {
        return values.config.mode !== undefined;
      },
      triggerFields: ['config'],
    },
  },
  {
    label: '支付宝公钥',
    fieldName: 'config.alipayPublicKey',
    component: 'Textarea',
    rules: 'required',
    componentProps: {
      placeholder: '请输入支付宝公钥',
      rows: 8,
    },
    dependencies: {
      show(values) {
        return values?.config?.mode === 0;
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: '商户公钥应用证书',
    fieldName: 'config.appCertContent',
    slotName: 'appCertContent',
    component: 'Textarea',
    rules: 'required',
    componentProps: {
      placeholder: '请上传商户公钥应用证书',
      rows: 8,
    },
    dependencies: {
      show(values) {
        return values?.config?.mode === 1;
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: '支付宝公钥证书',
    fieldName: 'config.alipayPublicCertContent',
    slotName: 'alipayPublicCertContent',
    component: 'Textarea',
    rules: 'required',
    componentProps: {
      placeholder: '请上传支付宝公钥证书',
      rows: 8,
    },
    dependencies: {
      show(values) {
        return values?.config?.mode === 1;
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: '根证书',
    fieldName: 'config.rootCertContent',
    slotName: 'rootCertContent',
    component: 'Textarea',
    rules: 'required',
    componentProps: {
      placeholder: '请上传根证书',
      rows: 8,
    },
    dependencies: {
      show(values) {
        return values?.config?.mode === 1;
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: '接口内容加密方式',
    fieldName: 'config.encryptType',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: [
        {
          value: 'NONE',
          label: '无加密',
        },
        {
          value: 'AES',
          label: 'AES',
        },
      ],
    },
    defaultValue: 'NONE',
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

export const modalMockSchema: FormSchemaGetter = () => [
  {
    label: '商户编号',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '应用编号',
    fieldName: 'appId',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道状态',
    fieldName: 'status',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
    },
    defaultValue: 1,
  },
  {
    label: '渠道编码',
    fieldName: 'code',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道费率',
    fieldName: 'feeRate',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入渠道费率',
    },
    dependencies: {
      show: () => false,
      triggerFields: [''],
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

export const modalWeixinSchema: FormSchemaGetter = () => [
  {
    label: '商户编号',
    fieldName: 'id',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '应用编号',
    fieldName: 'appId',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道编码',
    fieldName: 'code',
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    label: '渠道费率',
    fieldName: 'feeRate',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入渠道费率',
    },
  },
  {
    label: '微信 APPID',
    fieldName: 'config.appId',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入微信 APPID',
    },
  },
  {
    label: '商户号',
    fieldName: 'config.mchId',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入商户号',
    },
  },
  {
    label: '渠道状态',
    fieldName: 'status',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
    },
    defaultValue: 1,
  },
  {
    label: 'API 版本',
    fieldName: 'config.apiVersion',
    component: 'RadioGroup',
    rules: 'required',
    componentProps: {
      options: [
        {
          label: 'v2',
          value: 'v2',
        },
        {
          label: 'v3',
          value: 'v3',
        },
      ],
    },
  },
  {
    label: '商户密钥',
    fieldName: 'config.mchKey',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入商户密钥',
    },
    dependencies: {
      show(values) {
        return values?.config?.apiVersion === 'v2';
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: 'apiclient_cert.p12 证书',
    fieldName: 'config.keyContent',
    slotName: 'keyContent',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请上传 apiclient_cert.p12 证书',
    },
    dependencies: {
      show(values) {
        return values?.config?.apiVersion === 'v2';
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: 'API V3 密钥',
    fieldName: 'config.apiV3Key',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入 API V3 密钥',
    },
    dependencies: {
      show(values) {
        return values?.config?.apiVersion === 'v3';
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: 'apiclient_key.pem 证书',
    fieldName: 'config.privateKeyContent',
    slotName: 'privateKeyContent',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请上传 apiclient_key.pem 证书',
    },
    dependencies: {
      show(values) {
        return values?.config?.apiVersion === 'v3';
      },
      triggerFields: ['config.mode', 'mode', 'config'],
    },
  },
  {
    label: '证书序列号',
    fieldName: 'config.certSerialNo',
    component: 'Input',
    rules: 'required',
    componentProps: {
      placeholder: '请输入证书序列号',
    },
    dependencies: {
      show(values) {
        return values?.config?.apiVersion === 'v3';
      },
      triggerFields: ['config.mode', 'mode', 'config'],
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
