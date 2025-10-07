<!-- 设备信息（头部） -->
<template>
  <div class="mb-4">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ device.deviceName }}</h2>
      </div>
      <div class="space-x-2">
        <!-- 右上：按钮 -->
        <a-button
          v-if="product.status === 0"
          v-hasPermi="['iot:device:update']"
          @click="openForm('update', device.id)"
        >
          编辑
        </a-button>
      </div>
    </div>

    <a-card class="mt-4">
      <a-descriptions :column="1">
        <a-descriptions-item label="产品">
          <a @click="goToProductDetail(product.id)" class="cursor-pointer text-blue-600">
            {{ product.name }}
          </a>
        </a-descriptions-item>
        <a-descriptions-item label="ProductKey">
          {{ product.productKey }}
          <a-button size="small" class="ml-2" @click="copyToClipboard(product.productKey)">
            复制
          </a-button>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 表单弹窗：添加/修改 -->
    <DeviceForm ref="formRef" @success="emit('refresh')" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import DeviceForm from '../DeviceForm.vue'
import type { ProductVO } from '#/api/iot/product/product'
import type { DeviceVO } from '#/api/iot/device/device'

interface Props {
  product: ProductVO
  device: DeviceVO
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  refresh: []
}>()

const router = useRouter()

/** 操作修改 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string | undefined) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success({ content: '复制成功' })
  } catch (error) {
    message.error({ content: '复制失败' })
  }
}

/** 跳转到产品详情页面 */
const goToProductDetail = (productId: number | undefined) => {
  if (productId) {
    router.push({ name: 'IoTProductDetail', params: { id: productId } })
  }
}
</script>
