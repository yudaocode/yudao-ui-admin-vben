<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import { updateProductStatus } from '#/api/iot/product/product';
import type { IotProductApi } from '#/api/iot/product/product';

import ProductForm from '../ProductForm.vue';

interface Props {
  product: IotProductApi.Product;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  refresh: [];
}>();

const router = useRouter();
const formRef = ref();

/** 复制到剪贴板 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
};

/** 跳转到设备管理 */
const goToDeviceList = (productId: number) => {
  router.push({ path: '/iot/device/device', query: { productId: String(productId) } });
};

/** 打开编辑表单 */
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id);
};

/** 发布产品 */
const confirmPublish = async (id: number) => {
  try {
    await updateProductStatus(id, 1);
    message.success('发布成功');
    emit('refresh');
  } catch {
    message.error('发布失败');
  }
};

/** 撤销发布 */
const confirmUnpublish = async (id: number) => {
  try {
    await updateProductStatus(id, 0);
    message.success('撤销发布成功');
    emit('refresh');
  } catch {
    message.error('撤销发布失败');
  }
};
</script>

<template>
  <div class="mb-4">
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ product.name }}</h2>
      </div>
      <div class="space-x-2">
        <a-button
          :disabled="product.status === 1"
          @click="openForm('update', product.id)"
        >
          编辑
        </a-button>
        <a-button
          v-if="product.status === 0"
          type="primary"
          @click="confirmPublish(product.id!)"
        >
          发布
        </a-button>
        <a-button
          v-if="product.status === 1"
          danger
          @click="confirmUnpublish(product.id!)"
        >
          撤销发布
        </a-button>
      </div>
    </div>

    <a-card class="mt-4">
      <a-descriptions :column="1">
        <a-descriptions-item label="ProductKey">
          {{ product.productKey }}
          <a-button size="small" class="ml-2" @click="copyToClipboard(product.productKey || '')">
            复制
          </a-button>
        </a-descriptions-item>
        <a-descriptions-item label="设备总数">
          <span class="ml-5 mr-2">{{ product.deviceCount ?? '加载中...' }}</span>
          <a-button size="small" @click="goToDeviceList(product.id!)">
            前往管理
          </a-button>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <!-- 表单弹窗 -->
    <ProductForm ref="formRef" @success="emit('refresh')" />
  </div>
</template>
