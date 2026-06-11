<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DeviceTypeEnum } from '@vben/constants';

import { message, Tabs } from 'antdv-next';

import { getDevice } from '#/api/iot/device/device';
import { getProduct, ProtocolTypeEnum } from '#/api/iot/product/product';
import { getThingModelListByProductId } from '#/api/iot/thingmodel';

import DeviceDetailConfig from './modules/config.vue';
import DeviceDetailsHeader from './modules/header.vue';
import DeviceDetailsInfo from './modules/info.vue';
import DeviceDetailsMessage from './modules/message.vue';
import DeviceModbusConfig from './modules/modbus-config.vue';
import DeviceDetailsSimulator from './modules/simulator.vue';
import DeviceDetailsSubDevice from './modules/sub-device.vue';
import DeviceDetailsThingModel from './modules/thing-model.vue';

const route = useRoute();
const router = useRouter();

const id = Number(route.params.id);
const loading = ref(true);
const product = ref<IotProductApi.Product>({} as IotProductApi.Product);
const device = ref<IotDeviceApi.Device>({} as IotDeviceApi.Device);
const activeTab = ref('info');
const thingModelList = ref<ThingModelApi.ThingModel[]>([]);
const deviceTabItems = computed(() => [
  { key: 'info', label: '设备信息' },
  { key: 'model', label: '物模型数据' },
  ...(product.value.deviceType === DeviceTypeEnum.GATEWAY
    ? [{ key: 'subDevice', label: '子设备管理' }]
    : []),
  { key: 'log', label: '设备消息' },
  { key: 'simulator', label: '模拟设备' },
  { key: 'config', label: '设备配置' },
  ...([
    ProtocolTypeEnum.MODBUS_TCP_CLIENT,
    ProtocolTypeEnum.MODBUS_TCP_SERVER,
  ].includes(product.value.protocolType as ProtocolTypeEnum)
    ? [{ key: 'modbus', label: 'Modbus 配置' }]
    : []),
]);

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

    <Tabs v-model:active-key="activeTab" :items="deviceTabItems" class="mt-4">
      <template #contentRender="{ item }">
        <DeviceDetailsInfo
          v-if="item.key === 'info' && activeTab === 'info' && device.id"
          :device="device"
          :product="product"
        />
        <DeviceDetailsThingModel
          v-else-if="item.key === 'model' && activeTab === 'model' && device.id"
          :device-id="device.id"
          :thing-model-list="thingModelList"
        />
        <DeviceDetailsSubDevice
          v-else-if="
            item.key === 'subDevice' && activeTab === 'subDevice' && device.id
          "
          :device-id="device.id"
        />
        <DeviceDetailsMessage
          v-else-if="item.key === 'log' && activeTab === 'log' && device.id"
          :device-id="device.id"
        />
        <DeviceDetailsSimulator
          v-else-if="
            item.key === 'simulator' && activeTab === 'simulator' && device.id
          "
          :device="device"
          :product="product"
          :thing-model-list="thingModelList"
        />
        <DeviceDetailConfig
          v-else-if="
            item.key === 'config' && activeTab === 'config' && device.id
          "
          :device="device"
          @success="() => getDeviceData(id)"
        />
        <DeviceModbusConfig
          v-else-if="
            item.key === 'modbus' && activeTab === 'modbus' && device.id
          "
          :device="device"
          :product="product"
          :thing-model-list="thingModelList"
        />
      </template>
    </Tabs>
  </Page>
</template>
