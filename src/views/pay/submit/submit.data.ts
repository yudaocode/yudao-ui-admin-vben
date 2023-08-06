import type { DescItem } from '@/components/Description'
import { useRender } from '@/components/Table'

export const descSchema: DescItem[] = [
  {
    label: '支付单号',
    field: 'id',
  },
  {
    label: '商品标题',
    field: 'subject',
  },
  {
    label: '商品内容',
    field: 'body',
  },
  {
    label: '支付金额',
    field: 'amount',
    render: (curVal) => {
      return useRender.renderText('￥', Number.parseFloat(curVal || 0 / 100).toFixed(2))
    },
  },
  {
    label: '创建时间',
    field: 'createTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '过期时间',
    field: 'expireTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
]
