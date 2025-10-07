<template>
  <Page>
    <DeviceDetailsHeader
      :loading="loading"
      :product="product"
      :device="device"
      @refresh="getDeviceData"
    />
    
    <a-tabs v-model:active-key="activeTab" class="device-detail-tabs mt-4">
      <a-tab-pane key="info" tab="设备信息">
        <DeviceDetailsInfo v-if="activeTab === 'info'" :product="product" :device="device" />
      </a-tab-pane>
      <a-tab-pane key="model" tab="物模型数据">
        <DeviceDetailsThingModel
          v-if="activeTab === 'model' && device.id"
          :device-id="device.id"
          :thing-model-list="thingModelList"
        />
      </a-tab-pane>
      <a-tab-pane v-if="product.deviceType === DeviceTypeEnum.GATEWAY" key="sub-device" tab="子设备管理" />
      <a-tab-pane key="log" tab="设备消息">
        <DeviceDetailsMessage v-if="activeTab === 'log' && device.id" :device-id="device.id" />
      </a-tab-pane>
      <a-tab-pane key="simulator" tab="模拟设备">
        <DeviceDetailsSimulator
          v-if="activeTab === 'simulator'"
          :product="product"
          :device="device"
          :thing-model-list="thingModelList"
        />
      </a-tab-pane>
      <a-tab-pane key="config" tab="设备配置">
        <DeviceDetailConfig
          v-if="activeTab === 'config'"
          :device="device"
          @success="getDeviceData"
        />
      </a-tab-pane>
    </a-tabs>
  </Page>
</template>
<script lang="ts" setup>
import { ref, unref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useTabbarStore } from '@vben/stores'
import { Page } from '@vben/common-ui'
import { DeviceApi } from '#/api/iot/device/device'
import type { DeviceVO } from '#/api/iot/device/device'
import { DeviceTypeEnum, ProductApi } from '#/api/iot/product/product'
import type { ProductVO } from '#/api/iot/product/product'
import { ThingModelApi } from '#/api/iot/thingmodel'
import type { ThingModelData } from '#/api/iot/thingmodel'
import DeviceDetailsHeader from './DeviceDetailsHeader.vue'
import DeviceDetailsInfo from './DeviceDetailsInfo.vue'
import DeviceDetailsThingModel from './DeviceDetailsThingModel.vue'
import DeviceDetailsMessage from './DeviceDetailsMessage.vue'
import DeviceDetailsSimulator from './DeviceDetailsSimulator.vue'
import DeviceDetailConfig from './DeviceDetailConfig.vue'

defineOptions({ name: 'IoTDeviceDetail' })

const route = useRoute()
const id = Number(route.params.id) // 将字符串转换为数字
const loading = ref(true) // 加载中
const product = ref<ProductVO>({} as ProductVO) // 产品详情
const device = ref<DeviceVO>({} as DeviceVO) // 设备详情
const activeTab = ref('info') // 默认激活的标签页
const thingModelList = ref<ThingModelData[]>([]) // 物模型列表数据

/** 获取设备详情 */
const getDeviceData = async () => {
  loading.value = true
  try {
    device.value = await DeviceApi.getDevice(id)
    await getProductData(device.value.productId)
    await getThingModelList(device.value.productId)
  } finally {
    loading.value = false
  }
}

/** 获取产品详情 */
const getProductData = async (id: number) => {
  product.value = await ProductApi.getProduct(id)
}

/** 获取物模型列表 */
const getThingModelList = async (productId: number) => {
  try {
    const data = await ThingModelApi.getThingModelList(productId)
    thingModelList.value = data || []
  } catch (error) {
    console.error('获取物模型列表失败:', error)
    thingModelList.value = []
  }
}

/** 初始化 */
const tabbarStore = useTabbarStore() // 视图操作
const router = useRouter() // 路由
const { currentRoute } = router
onMounted(async () => {
  if (!id) {
    message.warning({ content: '参数错误，产品不能为空！' })
    await tabbarStore.closeTab(unref(currentRoute), router)
    return
  }
  await getDeviceData()
  activeTab.value = (route.query.tab as string) || 'info'
})
</script>

