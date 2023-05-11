import { changeAppStatus } from '@/api/pay/app'
import { getMerchantListByName } from '@/api/pay/merchant'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { PayChannelEnum } from '@/enums/systemEnum'
import { useMessage } from '@/hooks/web/useMessage'
import { DICT_TYPE, getDictOpts } from '@/utils/dict'
import { Tag, Switch } from 'ant-design-vue'
import { h } from 'vue'

export const columns: BasicColumn[] = [
  {
    title: '应用编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '应用名',
    dataIndex: 'name',
    width: 100
  },
  {
    title: '开启状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus')) {
        record.pendingStatus = false
      }
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
              createMessage.success(`已成功修改应用状态`)
            })
            .catch(() => {
              createMessage.error('修改应用状态失败')
            })
            .finally(() => {
              record.pendingStatus = false
            })
        }
      })
    }
  },
  {
    title: '商户名称',
    dataIndex: 'payMerchant.name',
    width: 100,
    customRender: ({ record }) => {
      return record.payMerchant.name || ''
    }
  },
  {
    title: '支付宝配置',
    children: [
      {
        title: PayChannelEnum.ALIPAY_APP.name,
        dataIndex: PayChannelEnum.ALIPAY_APP.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.ALIPAY_APP.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.ALIPAY_PC.name,
        dataIndex: PayChannelEnum.ALIPAY_PC.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.ALIPAY_PC.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.ALIPAY_WAP.name,
        dataIndex: PayChannelEnum.ALIPAY_WAP.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.ALIPAY_WAP.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.ALIPAY_QR.name,
        dataIndex: PayChannelEnum.ALIPAY_QR.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.ALIPAY_QR.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.ALIPAY_BAR.name,
        dataIndex: PayChannelEnum.ALIPAY_BAR.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.ALIPAY_BAR.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      }
    ]
  },
  {
    title: '微信配置',
    children: [
      {
        title: PayChannelEnum.WX_LITE.name,
        dataIndex: PayChannelEnum.WX_LITE.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.WX_LITE.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.WX_PUB.name,
        dataIndex: PayChannelEnum.WX_PUB.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.WX_PUB.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      },
      {
        title: PayChannelEnum.WX_APP.name,
        dataIndex: PayChannelEnum.WX_APP.code,
        width: 160,
        customRender: ({ record }) => {
          const isUpdate = record.channelCodes.indexOf(PayChannelEnum.WX_APP.code) !== -1
          return h(Tag, { color: isUpdate ? '#108ee9' : '#f50000' }, () => (isUpdate ? '已设置' : '未设置'))
        }
      }
    ]
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '应用名',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '商户名称',
    field: 'merchantName',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOpts(DICT_TYPE.COMMON_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  }
]

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '应用名',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '所属商户',
    field: 'shortName',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: () => getMerchantListByName(''),
      labelField: 'name',
      valueField: 'id'
    }
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getDictOpts(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '支付结果的回调地址',
    field: 'payNotifyUrl',
    required: true,
    component: 'Input'
  },
  {
    label: '退款结果的回调地址',
    field: 'refundNotifyUrl',
    required: true,
    component: 'Input'
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]
