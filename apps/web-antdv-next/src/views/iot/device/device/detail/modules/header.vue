<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';

import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { Button, Card, Descriptions, message } from 'ant-design-vue';

import DeviceForm from '../../modules/form.vue';

interface Props {
  product: IotProductApi.Product;
  device: IotDeviceApi.Device;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  refresh: [];
}>();

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DeviceForm,
  destroyOnClose: true,
});

/** 复制到剪贴板 */
async function copyToClipboard(text: string | undefined) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

/** 跳转到产品详情页面 */
function goToProductDetail(productId: number | undefined) {
  if (productId) {
    router.push({ name: 'IoTProductDetail', params: { id: productId } });
  }
}

/** 打开编辑表单 */
function openEditForm(row: IotDeviceApi.Device) {
  formModalApi.setData(row).open();
}
</script>
<template>
  <div class="mb-4">
    <FormModal @success="emit('refresh')" />

    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ device.deviceName }}</h2>
      </div>
      <div class="space-x-2">
        <Button
          v-if="product.status === 0"
          v-access:code="['iot:device:update']"
          @click="openEditForm(device)"
        >
          编辑
        </Button>
      </div>
    </div>

    <Card class="mt-4">
      <Descriptions :column="2">
        <Descriptions.Item label="产品">
          <a
            class="cursor-pointer text-blue-600"
            @click="goToProductDetail(product.id)"
          >
            {{ product.name }}
          </a>
        </Descriptions.Item>
        <Descriptions.Item label="ProductKey">
          {{ product.productKey }}
          <Button
            class="ml-2"
            size="small"
            @click="copyToClipboard(product.productKey)"
          >
            复制
          </Button>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
</template>
