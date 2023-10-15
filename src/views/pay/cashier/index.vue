<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Card } from 'ant-design-vue'
import { channelsAlipay, channelsMock, channelsWechat, descSchema } from './cashier.data'
import { Description, useDescription } from '@/components/Description'
import { getOrder } from '@/api/pay/order'

const { query } = useRoute()

const datas = ref()

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas,
})

async function getInfo() {
  const queryId = query.id as unknown as number // 从 URL 传递过来的 id 编号
  const res = await getOrder(queryId)
  datas.value = res
}

/** 提交支付 */
function submit(channelCode: string) {
  console.info(channelCode)
}

/** 初始化 **/
onMounted(async () => {
  await getInfo()
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
          <Card.Meta :title="alipay.name" />
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
          <Card.Meta :title="wechat.name" />
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
          <Card.Meta :title="mock.name" />
        </Card>
      </div>
    </Card>
  </div>
</template>>
