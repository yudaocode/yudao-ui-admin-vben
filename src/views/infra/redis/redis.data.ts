import type { DescItem } from '@/components/Description'

export const baseInfoSchema: DescItem[] = [
  {
    label: 'Redis版本',
    field: 'redis_version',
  },
  {
    label: '运行模式',
    field: 'redis_mode',
    render: (val) => {
      return val === 'standalone' ? '单机' : '集群'
    },
  },
  {
    label: '端口',
    field: 'tcp_port',
  },
  {
    label: '客户端数',
    field: 'connected_clients',
  },
  {
    label: '运行时间(天)',
    field: 'uptime_in_days',
  },
  {
    label: '使用内存',
    field: 'used_memory_human',
  },
  {
    label: '使用CPU',
    field: 'tcp_port',
    render: (val) => {
      return Number.parseFloat(val).toFixed(2)
    },
  },
  {
    label: '内存配置',
    field: 'maxmemory_human',
  },
  {
    label: 'AOF是否开启',
    field: 'maxmemory_human',
    render: (val) => {
      return val === '0' ? '否' : '是'
    },
  },
  {
    label: 'RDB是否成功',
    field: 'rdb_last_bgsave_status',
  },
  {
    label: 'Key数量',
    field: 'expired_keys',
  },
  {
    label: '网络入口/出口',
    field: 'instantaneous_input_kbps',
    render: (_val, data) => {
      return `${data.instantaneous_input_kbps}kps / ${data.instantaneous_output_kbps}kps`
    },
  },
]
