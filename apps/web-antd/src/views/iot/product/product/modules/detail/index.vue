<script setup lang="ts">
import { onMounted, provide, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';

import { getProduct } from '#/api/iot/product/product';
import type { IotProductApi } from '#/api/iot/product/product';
import { getDeviceCount } from '#/api/iot/device/device';

import ProductDetailsHeader from './ProductDetailsHeader.vue';
import ProductDetailsInfo from './ProductDetailsInfo.vue';
import IoTProductThingModel from '#/views/iot/thingmodel/index.vue';

defineOptions({ name: 'IoTProductDetail' });

const route = useRoute();
const router = useRouter();

const id = Number(route.params.id);
const loading = ref(true);
const product = ref<IotProductApi.Product>({} as IotProductApi.Product);
const activeTab = ref('info');

// 提供产品信息给子组件
provide('product', product);

/** 获取产品详情 */
const getProductData = async (productId: number) => {
  loading.value = true;
  try {
    product.value = await getProduct(productId);
  } catch {
    message.error('获取产品详情失败');
  } finally {
    loading.value = false;
  }
};

/** 查询设备数量 */
const getDeviceCountData = async (productId: number) => {
  try {
    return await getDeviceCount(productId);
  } catch (error) {
    console.error('Error fetching device count:', error, 'productId:', productId);
    return 0;
  }
};

/** 初始化 */
onMounted(async () => {
  if (!id) {
    message.warning('参数错误，产品不能为空！');
    router.back();
    return;
  }
  
  await getProductData(id);
  
  // 处理 tab 参数
  const { tab } = route.query;
  if (tab) {
    activeTab.value = tab as string;
  }
  
  // 查询设备数量
  if (product.value.id) {
    product.value.deviceCount = await getDeviceCountData(product.value.id);
  }
});
</script>

<template>
  <Page>
    <ProductDetailsHeader
      :loading="loading"
      :product="product"
      @refresh="() => getProductData(id)"
    />

    <a-tabs v-model:active-key="activeTab" class="mt-4">
      <a-tab-pane key="info" tab="产品信息">
        <ProductDetailsInfo v-if="activeTab === 'info'" :product="product" />
      </a-tab-pane>
      <a-tab-pane key="thingModel" tab="物模型（功能定义）">
        <IoTProductThingModel v-if="activeTab === 'thingModel'" :product-id="id" />
      </a-tab-pane>
    </a-tabs>
  </Page>
</template>
