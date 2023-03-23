import { DescItem } from '@/components/Description'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE } from '@/utils/dict'

export const baseInfoSchema: DescItem[] = [
  {
    label: 'Redis版本',
    field: 'redis_version'
  },
  {
    label: '运行模式',
    field: 'redis_mode',
    render: (val) => {
      return val === 'standalone' ? '单机' : '集群'
    }
  },
  {
    label: '端口',
    field: 'tcp_port'
  },
  {
    label: '客户端数',
    field: 'connected_clients'
  },
  {
    label: '运行时间(天)',
    field: 'uptime_in_days'
  },
  {
    label: '使用内存',
    field: 'used_memory_human'
  },
  {
    label: '使用CPU',
    field: 'tcp_port',
    render: (val) => {
      return parseFloat(val).toFixed(2)
    }
  },
  {
    label: '内存配置',
    field: 'maxmemory_human'
  },
  {
    label: 'AOF是否开启',
    field: 'maxmemory_human',
    render: (val) => {
      return val === '0' ? '否' : '是'
    }
  },
  {
    label: 'RDB是否成功',
    field: 'rdb_last_bgsave_status'
  },
  {
    label: 'Key数量',
    field: 'expired_keys'
  },
  {
    label: '网络入口/出口',
    field: 'instantaneous_input_kbps',
    render: (val, data) => {
      console.info(val)
      return data.instantaneous_input_kbps + 'kps / ' + data.instantaneous_output_kbps + 'kps'
    }
  }
]

export const tableSchema: BasicColumn[] = [
  {
    title: 'Key 模板',
    dataIndex: 'keyTemplate',
    width: 200
  },
  {
    title: 'Key 类型',
    dataIndex: 'keyType',
    width: 100
  },
  {
    title: 'Value 类型',
    dataIndex: 'valueType',
    width: 300
  },
  {
    title: '超时类型',
    dataIndex: 'timeoutType',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_REDIS_TIMEOUT_TYPE)
    }
  },
  {
    title: '超时时间',
    dataIndex: 'timeout',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderText(text === 0 ? 0 : text / 1000, '秒')
    }
  }
]

export const formSchema: FormSchema[] = [
  {
    label: '缓存键名',
    field: 'cacheForm.key',
    dynamicDisabled: true,
    component: 'Input'
  },
  {
    label: '缓存内容',
    field: 'cacheForm.value',
    dynamicDisabled: true,
    component: 'InputTextArea'
  }
]
