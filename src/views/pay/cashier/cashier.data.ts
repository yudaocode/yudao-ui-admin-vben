import type { DescItem } from '@/components/Description'
import { useRender } from '@/components/Table'

// 导入图标
import svg_alipay_pc from '@/assets/svg/pay/icon/alipay_pc.svg'
import svg_alipay_wap from '@/assets/svg/pay/icon/alipay_wap.svg'
import svg_alipay_app from '@/assets/svg/pay/icon/alipay_app.svg'
import svg_alipay_qr from '@/assets/svg/pay/icon/alipay_qr.svg'
import svg_alipay_bar from '@/assets/svg/pay/icon/alipay_bar.svg'
import svg_wx_pub from '@/assets/svg/pay/icon/wx_pub.svg'
import svg_wx_lite from '@/assets/svg/pay/icon/wx_lite.svg'
import svg_wx_app from '@/assets/svg/pay/icon/wx_app.svg'
import svg_wx_native from '@/assets/svg/pay/icon/wx_native.svg'
import svg_wx_bar from '@/assets/svg/pay/icon/wx_bar.svg'
import svg_mock from '@/assets/svg/pay/icon/mock.svg'

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

export const channelsAlipay = [
  {
    name: '支付宝 PC 网站支付',
    icon: svg_alipay_pc,
    code: 'alipay_pc',
  },
  {
    name: '支付宝 Wap 网站支付',
    icon: svg_alipay_wap,
    code: 'alipay_wap',
  },
  {
    name: '支付宝 App 网站支付',
    icon: svg_alipay_app,
    code: 'alipay_app',
  },
  {
    name: '支付宝扫码支付',
    icon: svg_alipay_qr,
    code: 'alipay_qr',
  },
  {
    name: '支付宝条码支付',
    icon: svg_alipay_bar,
    code: 'alipay_bar',
  },
]

export const channelsWechat = [
  {
    name: '微信公众号支付',
    icon: svg_wx_pub,
    code: 'wx_pub',
  },
  {
    name: '微信小程序支付',
    icon: svg_wx_lite,
    code: 'wx_lite',
  },
  {
    name: '微信 App 支付',
    icon: svg_wx_app,
    code: 'wx_app',
  },
  {
    name: '微信扫码支付',
    icon: svg_wx_native,
    code: 'wx_native',
  },
  {
    name: '微信条码支付',
    icon: svg_wx_bar,
    code: 'wx_bar',
  },
]

export const channelsMock = [
  {
    name: '模拟支付',
    icon: svg_mock,
    code: 'mock',
  },
]
