<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Card } from 'ant-design-vue'
import CashierModal from './CashierModal.vue'
import { channelsAlipay, channelsMock, channelsWechat, descSchema } from './cashier.data'
import { useModal } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description'
import { getOrder, submitOrder } from '@/api/pay/order'
import { PayChannelEnum, PayDisplayModeEnum, PayOrderStatusEnum } from '@/enums/systemEnum'
import { useMessage } from '@/hooks/web/useMessage'
import { useGo } from '@/hooks/web/usePage'
import { useTabs } from '@/hooks/web/useTabs'

const go = useGo()
const { query } = useRoute()
const { close } = useTabs()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const datas = ref()
const submitLoading = ref(false) // 提交支付的 loading
const interval = ref<any>(undefined) // 定时任务，轮询是否完成支付

const id = ref(0) // 支付单号
const returnUrl = ref<string | undefined>(undefined) // 支付完的回调地址

// 展示形式：二维码
const qrCode = ref({
  url: '',
  title: '',
})

// 展示形式：条形码
const barCode = ref({
  channelCode: '',
  value: '',
  title: '',
})

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas,
})

/** 提交支付 */
function submit(channelCode: string) {
  // 条形码支付，需要特殊处理
  if (channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    barCode.value = {
      channelCode,
      value: '',
      title: '“支付宝”条码支付',
    }
    openModal(true, { type: 'barCode', code: barCode.value })
    return
  }
  if (channelCode === PayChannelEnum.WX_BAR.code) {
    barCode.value = {
      channelCode,
      value: '',
      title: '“微信”条码支付',
    }
    openModal(true, { type: 'barCode', code: barCode.value })
    return
  }

  // 微信公众号、小程序支付，无法在 PC 网页中进行
  if (channelCode === PayChannelEnum.WX_PUB.code) {
    createMessage.error('微信公众号支付：不支持 PC 网站')
    return
  }
  if (channelCode === PayChannelEnum.WX_LITE.code) {
    createMessage.error('微信小程序：不支持 PC 网站')
    return
  }

  // 默认的提交处理
  submit0(channelCode)
}

async function submit0(channelCode) {
  submitLoading.value = true
  try {
    const formData = {
      id: id.value,
      channelCode,
      returnUrl: location.href, // 支付成功后，支付渠道跳转回当前页；再由当前页，跳转回 {@link returnUrl} 对应的地址
      ...buildSubmitParam(channelCode),
    }
    const data = await submitOrder(formData)
    // 直接返回已支付的情况，例如说扫码支付
    if (data.status === PayOrderStatusEnum.SUCCESS.status) {
      clearQueryInterval()
      createMessage.success('支付成功！')
      goReturnUrl('success')
      return
    }

    // 展示对应的界面
    if (data.displayMode === PayDisplayModeEnum.URL.mode)
      displayUrl(channelCode, data)
    else if (data.displayMode === PayDisplayModeEnum.QR_CODE.mode)
      displayQrCode(channelCode, data)
    else if (data.displayMode === PayDisplayModeEnum.APP.mode)
      displayApp(channelCode)

    // 打开轮询任务
    createQueryInterval()
  }
  finally {
    submitLoading.value = false
  }
}

/** 构建提交支付的额外参数 */
function buildSubmitParam(channelCode) {
  // ① 支付宝 BarCode 支付时，需要传递 authCode 条形码
  if (channelCode === PayChannelEnum.ALIPAY_BAR.code) {
    return {
      channelExtras: {
        auth_code: barCode.value.value,
      },
    }
  }
  // ② 微信 BarCode 支付时，需要传递 authCode 条形码
  if (channelCode === PayChannelEnum.WX_BAR.code) {
    return {
      channelExtras: {
        authCode: barCode.value.value,
      },
    }
  }
  return {}
}

/** 提交支付后，URL 的展示形式 */
function displayUrl(_channelCode, data) {
  location.href = data.displayContent
  submitLoading.value = false
}

/** 提交支付后（扫码支付） */
function displayQrCode(channelCode, data) {
  let title = '请使用手机浏览器“扫一扫”'
  if (channelCode === PayChannelEnum.ALIPAY_WAP.code) {
    // 考虑到 WAP 测试，所以引导手机浏览器搞
  }
  else if (channelCode.indexOf('alipay_') === 0) {
    title = '请使用支付宝“扫一扫”扫码支付'
  }
  else if (channelCode.indexOf('wx_') === 0) {
    title = '请使用微信“扫一扫”扫码支付'
  }
  qrCode.value = {
    title,
    url: data.displayContent,
  }
  openModal(true, { type: 'qrCode', code: qrCode.value })
  submitLoading.value = false
}

/** 提交支付后（App） */
function displayApp(channelCode) {
  if (channelCode === PayChannelEnum.ALIPAY_APP.code)
    createMessage.error('支付宝 App 支付：无法在网页支付！')

  if (channelCode === PayChannelEnum.WX_APP.code)
    createMessage.error('微信 App 支付：无法在网页支付！')

  submitLoading.value = false
}

/** 轮询查询任务 */
function createQueryInterval() {
  if (interval.value)
    return

  interval.value = setInterval(async () => {
    const data = await getOrder(id.value)
    // 已支付
    if (data.status === PayOrderStatusEnum.SUCCESS.status) {
      clearQueryInterval()
      createMessage.success('支付成功！')
      goReturnUrl('success')
    }
    // 已取消
    if (data.status === PayOrderStatusEnum.CLOSED.status) {
      clearQueryInterval()
      createMessage.error('支付已关闭！')
      goReturnUrl('close')
    }
  }, 1000 * 2)
}
/** 清空查询任务 */
function clearQueryInterval() {
  // 清空各种弹窗
  qrCode.value = {
    title: '',
    url: '',
  }
  openModal(true, { type: 'qrCode', code: qrCode.value })
  // 清空任务
  clearInterval(interval.value)
  interval.value = undefined
}

/**
 * 回到业务的 URL
 *
 * @param payResult 支付结果
 *                  ① success：支付成功
 *                  ② cancel：取消支付
 *                  ③ close：支付已关闭
 */
function goReturnUrl(payResult) {
// 清理任务
  clearQueryInterval()

  // 未配置的情况下，只能关闭
  if (!returnUrl.value) {
    close()
    return
  }

  const url
  = returnUrl.value.includes('?')
    ? `${returnUrl.value}&payResult=${payResult}`
    : `${returnUrl.value}?payResult=${payResult}`
  // 如果有配置，且是 http 开头，则浏览器跳转
  if (returnUrl.value.indexOf('http') === 0) {
    location.href = url
  }
  else {
    close()
    go(url)
  }
}

async function getDetail() {
  id.value = query.id as unknown as number // 从 URL 传递过来的 id 编号
  returnUrl.value = decodeURIComponent(query.returnUrl as unknown as string)
  // 1.1 未传递订单编号
  if (!id.value) {
    createMessage.error('未传递支付单号，无法查看对应的支付信息')
    goReturnUrl('cancel')
    return
  }
  const res = await getOrder(id.value)
  datas.value = res
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>

<template>
  <div class="p-4">
    <Card title="支付信息">
      <Description :column="3" @register="registerDesc" />
    </Card>
    <Card title="支付" class="mt-4">
      <p class="mb-4 text-lg text-dark-900">
        选择支付宝支付
      </p>
      <div class="flex">
        <Card
          v-for="(alipay, index) in channelsAlipay"
          :key="index"
          hoverable
          class="mr-2 w-50 cursor-pointer pb-2 pt-2"
          @click="submit(alipay.code)"
        >
          <template #cover>
            <img alt="example" :src="alipay.icon" class="h-10 w-10">
          </template>
          <Card.Meta :title="alipay.name" class="text-center" />
        </Card>
      </div>
      <p class="mb-4 text-lg text-dark-900">
        选择微信支付
      </p>
      <div class="flex">
        <Card
          v-for="(wechat, index) in channelsWechat"
          :key="index"
          hoverable
          class="mr-2 w-50 cursor-pointer pb-2 pt-2"
          @click="submit(wechat.code)"
        >
          <template #cover>
            <img alt="example" :src="wechat.icon" class="h-10 w-10">
          </template>
          <Card.Meta :title="wechat.name" class="text-center" />
        </Card>
      </div>
      <p class="mb-4 text-lg text-dark-900">
        选择其它支付
      </p>
      <div class="flex">
        <Card
          v-for="(mock, index) in channelsMock"
          :key="index"
          hoverable
          class="mr-2 w-50 cursor-pointer pb-2 pt-2"
          @click="submit(mock.code)"
        >
          <template #cover>
            <img alt="example" :src="mock.icon" class="h-10 w-10">
          </template>
          <Card.Meta :title="mock.name" class="text-center" />
        </Card>
      </div>
    </Card>
    <CashierModal @register="registerModal" @success="submit0" />
  </div>
</template>>
