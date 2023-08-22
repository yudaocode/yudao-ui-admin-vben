import { Switch } from 'ant-design-vue'
import { h } from 'vue'
import { changeAppStatus } from '@/api/pay/app'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { PayChannelEnum } from '@/enums/systemEnum'
import { useMessage } from '@/hooks/web/useMessage'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '应用编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '应用名',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '开启状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus'))
        record.pendingStatus = false

      return h(Switch, {
        checked: record.status === 0,
        checkedChildren: '已启用',
        unCheckedChildren: '已禁用',
        loading: record.pendingStatus,
        onChange(checked: boolean) {
          record.pendingStatus = true
          const newStatus = checked ? 0 : 1
          const { createMessage } = useMessage()
          changeAppStatus({ id: record.id, status: newStatus })
            .then(() => {
              record.status = newStatus
              createMessage.success('已成功修改应用状态')
            })
            .catch(() => {
              createMessage.error('修改应用状态失败')
            })
            .finally(() => {
              record.pendingStatus = false
            })
        },
      })
    },
  },
  {
    title: '支付宝配置',
    children: [
      {
        title: PayChannelEnum.ALIPAY_APP.name,
        dataIndex: PayChannelEnum.ALIPAY_APP.code,
        width: 160,
      },
      {
        title: PayChannelEnum.ALIPAY_PC.name,
        dataIndex: PayChannelEnum.ALIPAY_PC.code,
        width: 160,
      },
      {
        title: PayChannelEnum.ALIPAY_WAP.name,
        dataIndex: PayChannelEnum.ALIPAY_WAP.code,
        width: 160,
      },
      {
        title: PayChannelEnum.ALIPAY_QR.name,
        dataIndex: PayChannelEnum.ALIPAY_QR.code,
        width: 160,
      },
      {
        title: PayChannelEnum.ALIPAY_BAR.name,
        dataIndex: PayChannelEnum.ALIPAY_BAR.code,
        width: 160,
      },
    ],
  },
  {
    title: '微信配置',
    children: [
      {
        title: PayChannelEnum.WX_LITE.name,
        dataIndex: PayChannelEnum.WX_LITE.code,
        width: 160,
      },
      {
        title: PayChannelEnum.WX_PUB.name,
        dataIndex: PayChannelEnum.WX_PUB.code,
        width: 160,
      },
      {
        title: PayChannelEnum.WX_APP.name,
        dataIndex: PayChannelEnum.WX_APP.code,
        width: 160,
      },
    ],
  },
  {
    title: '模拟支付配置',
    children: [
      {
        title: PayChannelEnum.MOCK.name,
        dataIndex: PayChannelEnum.MOCK.code,
        width: 160,
      },
    ],
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '应用名',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '应用名',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '支付结果的回调地址',
    field: 'orderNotifyUrl',
    required: true,
    component: 'Input',
  },
  {
    label: '退款结果的回调地址',
    field: 'refundNotifyUrl',
    required: true,
    component: 'Input',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]

export const aliPayFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '渠道费率',
    field: 'feeRate',
    defaultValue: 0,
    required: true,
    component: 'InputNumber',
  },
  {
    label: '开放平台APPID',
    field: 'payConfig.appId',
    required: true,
    component: 'Input',
  },
  {
    label: '渠道状态',
    field: 'status',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '网关地址',
    field: 'payConfig.serverUrl',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: [
        { value: 'https://openapi.alipay.com/gateway.do', label: '线上环境' },
        { value: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do', label: '沙箱环境' },
      ],
    },
  },
  {
    label: '算法类型',
    field: 'payConfig.signType',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: [
        { value: 'RSA2', label: 'RSA2', key: 'RSA2' },
      ],
    },
  },
  {
    label: '公钥类型',
    field: 'payConfig.mode',
    required: true,
    defaultValue: null,
    component: 'RadioGroup',
    componentProps: {
      options: [
        { value: 1, label: '公钥模式', key: '1' },
        { value: 2, label: '证书模式', key: '2' },
      ],
    },
  },
  {
    label: '应用私钥',
    field: 'payConfig.privateKey',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.mode'] === 1),
    component: 'InputTextArea',
  },
  {
    label: '支付宝公钥',
    field: 'payConfig.alipayPublicKey',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.mode'] === 1),
    component: 'InputTextArea',
  },
  {
    label: '商户公钥应用证书',
    field: 'payConfig.appCertContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.mode'] === 2),
    component: 'InputTextArea',
  },
  {
    label: '支付宝公钥证书',
    field: 'payConfig.alipayPublicCertContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.mode'] === 2),
    component: 'InputTextArea',
  },
  {
    label: '根证书',
    field: 'payConfig.rootCertContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.mode'] === 2),
    component: 'InputTextArea',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]

export const weChatFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '渠道费率',
    field: 'feeRate',
    defaultValue: 0,
    required: true,
    component: 'InputNumber',
  },
  {
    label: '公众号 APPID',
    field: 'payConfig.appId',
    required: true,
    component: 'Input',
  },
  {
    label: '商户号',
    field: 'payConfig.mchId',
    required: true,
    component: 'Input',
  },
  {
    label: '渠道状态',
    field: 'status',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: 'API 版本',
    field: 'payConfig.apiVersion',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: [
        { value: 'v2', label: 'v2' },
        { value: 'v3', label: 'v3' },
      ],
    },
  },
  {
    label: '商户密钥',
    field: 'payConfig.mchKey',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.apiVersion'] === 'v2'),
    component: 'InputTextArea',
  },
  {
    label: 'apiclient_cert.p12 证书',
    field: 'payConfig.keyContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.apiVersion'] === 'v2'),
    component: 'InputTextArea',
  },
  {
    label: 'API V3密钥',
    field: 'payConfig.apiV3Key',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.apiVersion'] === 'v3'),
    component: 'InputTextArea',
  },
  {
    label: 'apiclient_key.perm证书',
    field: 'payConfig.privateKeyContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.apiVersion'] === 'v3'),
    component: 'InputTextArea',
  },
  {
    label: 'apiclient_cert.perm证书',
    field: 'payConfig.privateCertContent',
    required: true,
    ifShow: ({ values }) => !!(values['payConfig.apiVersion'] === 'v3'),
    component: 'InputTextArea',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]

export const mockFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '渠道状态',
    field: 'status',
    required: true,
    component: 'RadioGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
