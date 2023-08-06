<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Card, List } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { descSchema } from './submit.data'
import { Description } from '@/components/Description'
import { getOrder, submitOrder } from '@/api/pay/order'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import alipay_qr from '@/assets/images/pay/icon/alipay_qr.svg'
import alipay_app from '@/assets/images/pay/icon/alipay_app.svg'
import alipay_wap from '@/assets/images/pay/icon/alipay_wap.svg'
import alipay_pc from '@/assets/images/pay/icon/alipay_pc.svg'
import alipay_bar from '@/assets/images/pay/icon/alipay_bar.svg'
import wx_app from '@/assets/images/pay/icon/wx_app.svg'
import wx_lite from '@/assets/images/pay/icon/wx_lite.svg'
import wx_pub from '@/assets/images/pay/icon/wx_pub.svg'
import mock from '@/assets/images/pay/icon/mock.svg'

defineOptions({ name: 'PayOrderSubmit' })

const ListItem = List.Item

const icons = {
  alipay_qr,
  alipay_app,
  alipay_wap,
  alipay_pc,
  alipay_bar,
  wx_app,
  wx_lite,
  wx_pub,
  mock,
}

const { query } = useRoute()
const orderData = ref()
const aliPayChannels = ref<any[]>([])
const wxPayChannels = ref<any[]>([])
const otherPayChannels = ref<any[]>([])

function initPayChannels() {
  // 微信支付
  for (const dict of getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE, 'string')) {
    const payChannel = {
      name: dict.label,
      code: dict.value as string,
    }
    if (payChannel.code.startsWith('wx_'))
      wxPayChannels.value.push(payChannel)
    else if (payChannel.code.startsWith('alipay_'))
      aliPayChannels.value.push(payChannel)
    else if (payChannel.code)
      otherPayChannels.value.push(payChannel)
  }
}
async function getDetail() {
  const queryId = query.id as unknown as number
  if (!queryId)
    return

  const res = await getOrder(queryId)
  orderData.value = res
}

function submit(channelCode) {
  submitOrder({ id: query.id as unknown as number, channelCode })
}

onMounted(async () => {
  await initPayChannels()
  await getDetail()
})
</script>

<template>
  <div>
    <Card>
      <Description :bordered="false" :column="3" :data="orderData" :schema="descSchema" />
    </Card>
    <Card class="mt-4 justify-center">
      <List :grid="{ column: 8 }" header="选择支付宝支付" :data-source="aliPayChannels">
        <template #renderItem="{ item }">
          <ListItem>
            <Card hoverable class="w-30 h-28 mt-3 pb-3" @click="submit(item.code)">
              <template #cover>
                <img class="w-40px h-40px mt-2" :src="icons[item.code]">
                <p class="mt-3 text-center">
                  {{ item.name }}
                </p>
              </template>
            </Card>
          </ListItem>
        </template>
      </List>
      <List :grid="{ column: 8 }" class="mt-4" header="选择微信支付" :data-source="wxPayChannels">
        <template #renderItem="{ item }">
          <ListItem>
            <Card hoverable class="w-30 h-28 pt-3 pb-3">
              <template #cover>
                <img class="w-40px h-40px mt-2" :src="icons[item.code]">
                <p class="mt-3 text-center">
                  {{ item.name }}
                </p>
              </template>
            </Card>
          </ListItem>
        </template>
      </List>
      <List :grid="{ column: 8 }" class="mt-4" header="选择其它支付" :data-source="otherPayChannels">
        <template #renderItem="{ item }">
          <ListItem>
            <Card hoverable class="w-30 h-28 pt-3 pb-3">
              <template #cover>
                <img class="w-40px h-40px mt-2" :src="icons[item.code]">
                <p class="mt-3 text-center">
                  {{ item.name }}
                </p>
              </template>
            </Card>
          </ListItem>
        </template>
      </List>
    </Card>
  </div>
</template>
