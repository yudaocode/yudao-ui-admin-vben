<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelData } from '#/api/iot/thingmodel';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DeviceTypeEnum } from '@vben/constants';

import { message, Tabs } from 'ant-design-vue';

import { getDevice } from '#/api/iot/device/device';
import { getProduct } from '#/api/iot/product/product';
import { getThingModelListByProductId } from '#/api/iot/thingmodel';

import DeviceDetailConfig from './modules/config.vue';
import DeviceDetailsHeader from './modules/header.vue';
import DeviceDetailsInfo from './modules/info.vue';
import DeviceDetailsMessage from './modules/message.vue';
import DeviceDetailsSimulator from './modules/simulator.vue';
import DeviceDetailsSubDevice from './modules/sub-device.vue';
import DeviceDetailsThingModel from './modules/thing-model.vue';

defineOptions({ name: 'IoTDeviceDetail' });

const route = useRoute();
const router = useRouter();

const id = Number(route.params.id);
const loading = ref(true);
const product = ref<IotProductApi.Product>({} as IotProductApi.Product);
const device = ref<IotDeviceApi.Device>({} as IotDeviceApi.Device);
const activeTab = ref('info');
const thingModelList = ref<ThingModelData[]>([]);

/** 获取设备详情 */
async function getDeviceData(deviceId: number) {
  loading.value = true;
  try {
    device.value = await getDevice(deviceId);
    await getProductData(device.value.productId);
    await getThingModelList(device.value.productId);
  } catch {
    message.error('获取设备详情失败');
  } finally {
    loading.value = false;
  }
}

/** 获取产品详情 */
async function getProductData(productId: number) {
  try {
    product.value = await getProduct(productId);
  } catch {
    message.error('获取产品详情失败');
  }
}

/** 获取物模型列表 */
async function getThingModelList(productId: number) {
  try {
    const data = await getThingModelListByProductId(productId);
    thingModelList.value = data || [];
  } catch {
    message.error('获取物模型列表失败');
    thingModelList.value = [];
  }
}

/** 初始化 */
onMounted(async () => {
  if (!id) {
    message.warning('参数错误，设备不能为空！');
    router.back();
    return;
  }

  await getDeviceData(id);

  // 处理 tab 参数
  const { tab } = route.query;
  if (tab) {
    activeTab.value = tab as string;
  }
});
</script>
<template>
  <Page>
    <DeviceDetailsHeader
      :device="device"
      :loading="loading"
      :product="product"
      @refresh="() => getDeviceData(id)"
    />

    <Tabs v-model:active-key="activeTab" class="mt-4">
      <Tabs.TabPane key="info" tab="设备信息">
        <DeviceDetailsInfo
          v-if="activeTab === 'info'"
          :device="device"
          :product="product"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="model" tab="物模型数据">
        <DeviceDetailsThingModel
          v-if="activeTab === 'model' && device.id"
          :device-id="device.id"
          :thing-model-list="thingModelList"
        />
      </Tabs.TabPane>
      <Tabs.TabPane
        v-if="product.deviceType === DeviceTypeEnum.GATEWAY"
        key="sub-device"
        tab="子设备管理"
      >
        <DeviceDetailsSubDevice
          v-if="activeTab === 'sub-device' && device.id"
          :device-id="device.id"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="log" tab="设备消息">
        <DeviceDetailsMessage
          v-if="activeTab === 'log' && device.id"
          :device-id="device.id"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="simulator" tab="模拟设备">
        <DeviceDetailsSimulator
          v-if="activeTab === 'simulator'"
          :device="device"
          :product="product"
          :thing-model-list="thingModelList"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="config" tab="设备配置">
        <DeviceDetailConfig
          v-if="activeTab === 'config'"
          :device="device"
          @success="() => getDeviceData(id)"
        />
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
