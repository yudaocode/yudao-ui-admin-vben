import { Switch } from 'ant-design-vue'
import { h } from 'vue'
import { changeMerchantStatus } from '@/api/pay/merchant'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { useMessage } from '@/hooks/web/useMessage'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '商户编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '商户号',
    dataIndex: 'no',
    width: 180,
  },
  {
    title: '商户全称',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '商户简称',
    dataIndex: 'shortName',
    width: 120,
  },
  {
    title: '开启状态',
    dataIndex: 'status',
    width: 180,
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
          changeMerchantStatus(record.id, newStatus)
            .then(() => {
              record.status = newStatus
              createMessage.success('已成功修改商户状态')
            })
            .catch(() => {
              createMessage.error('修改商户状态失败')
            })
            .finally(() => {
              record.pendingStatus = false
            })
        },
      })
    },
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 180,
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
    label: '商户号',
    field: 'no',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '商户全称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '商户简称',
    field: 'shortName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'Input',
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
    label: '商户全称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '商户简称',
    field: 'shortName',
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
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
