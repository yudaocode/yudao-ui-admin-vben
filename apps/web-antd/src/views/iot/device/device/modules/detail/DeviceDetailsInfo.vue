<!-- 设备信息 -->
<template>
  <div>
    <a-row :gutter="16">
      <!-- 左侧设备信息 -->
      <a-col :span="12">
        <a-card class="h-full">
          <template #title>
            <div class="flex items-center">
              <Icon icon="ep:info-filled" class="mr-2 text-primary" />
              <span>设备信息</span>
            </div>
          </template>
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="产品名称">
              {{ product.name }}
            </a-descriptions-item>
            <a-descriptions-item label="ProductKey">
              {{ product.productKey }}
            </a-descriptions-item>
            <a-descriptions-item label="设备类型">
              <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
            </a-descriptions-item>
            <a-descriptions-item label="DeviceName">
              {{ device.deviceName }}
            </a-descriptions-item>
            <a-descriptions-item label="备注名称">
              {{ device.nickname || '--' }}
            </a-descriptions-item>
            <a-descriptions-item label="当前状态">
              <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATUS" :value="device.state" />
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDate(device.createTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="激活时间">
              {{ formatDate(device.activeTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="最后上线时间">
              {{ formatDate(device.onlineTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="最后离线时间">
              {{ formatDate(device.offlineTime) }}
            </a-descriptions-item>
            <a-descriptions-item label="MQTT 连接参数">
              <a-button type="link" @click="handleAuthInfoDialogOpen" size="small">
                查看
              </a-button>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 右侧地图 -->
      <a-col :span="12">
        <a-card class="h-full">
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <Icon icon="ep:location" class="mr-2 text-primary" />
                <span>设备位置</span>
              </div>
            </div>
          </template>
          <div class="h-[500px] w-full">
            <div v-if="showMap" class="h-full w-full bg-gray-100 flex items-center justify-center rounded">
              <span class="text-gray-400">地图组件</span>
            </div>
            <div
              v-else
              class="flex items-center justify-center h-full w-full bg-gray-50 text-gray-400 rounded"
            >
              <Icon icon="ep:warning" class="mr-2" />
              <span>暂无位置信息</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 认证信息弹框 -->
    <a-modal
      v-model:open="authDialogVisible"
      title="MQTT 连接参数"
      width="640px"
      :footer="null"
    >
      <a-form :label-col="{ span: 6 }">
        <a-form-item label="clientId">
          <a-input-group compact>
            <a-input v-model:value="authInfo.clientId" readonly style="width: calc(100% - 80px)" />
            <a-button @click="copyToClipboard(authInfo.clientId)" type="primary">
              <Icon icon="ph:copy" />
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="username">
          <a-input-group compact>
            <a-input v-model:value="authInfo.username" readonly style="width: calc(100% - 80px)" />
            <a-button @click="copyToClipboard(authInfo.username)" type="primary">
              <Icon icon="ph:copy" />
            </a-button>
          </a-input-group>
        </a-form-item>
        <a-form-item label="password">
          <a-input-group compact>
            <a-input
              v-model:value="authInfo.password"
              readonly
              :type="authPasswordVisible ? 'text' : 'password'"
              style="width: calc(100% - 160px)"
            />
            <a-button @click="authPasswordVisible = !authPasswordVisible" type="primary">
              <Icon :icon="authPasswordVisible ? 'ph:eye-slash' : 'ph:eye'" />
            </a-button>
            <a-button @click="copyToClipboard(authInfo.password)" type="primary">
              <Icon icon="ph:copy" />
            </a-button>
          </a-input-group>
        </a-form-item>
      </a-form>
      <div class="text-right mt-4">
        <a-button @click="handleAuthInfoDialogClose">关闭</a-button>
      </div>
    </a-modal>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DICT_TYPE } from '@vben/constants'
import type { ProductVO } from '#/api/iot/product/product'
import { formatDate } from '@vben/utils'
import type { DeviceVO } from '#/api/iot/device/device'
import { DeviceApi } from '#/api/iot/device/device'
import type { IotDeviceAuthInfoVO } from '#/api/iot/device/device'

 // 消息提示

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>() // 定义 Props
const emit = defineEmits(['refresh']) // 定义 Emits

const authDialogVisible = ref(false) // 定义设备认证信息弹框的可见性
const authPasswordVisible = ref(false) // 定义密码可见性状态
const authInfo = ref<IotDeviceAuthInfoVO>({} as IotDeviceAuthInfoVO) // 定义设备认证信息对象

/** 控制地图显示的标志 */
const showMap = computed(() => {
  return !!(device.longitude && device.latitude)
})

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success({ content: '复制成功' })
  } catch (error) {
    message.error({ content: '复制失败' })
  }
}

/** 打开设备认证信息弹框的方法 */
const handleAuthInfoDialogOpen = async () => {
  if (!device.id) return
  try {
    authInfo.value = await DeviceApi.getDeviceAuthInfo(device.id)
    // 显示设备认证信息弹框
    authDialogVisible.value = true
  } catch (error) {
    console.error('获取设备认证信息出错：', error)
    message.error({ content: '获取设备认证信息失败，请检查网络连接或联系管理员' })
  }
}

/** 关闭设备认证信息弹框的方法 */
const handleAuthInfoDialogClose = () => {
  authDialogVisible.value = false
}
</script>
