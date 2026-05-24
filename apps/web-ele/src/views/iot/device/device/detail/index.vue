<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotProductApi } from '#/api/iot/product/product';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DeviceTypeEnum } from '@vben/constants';

import { ElMessage, ElTabPane, ElTabs } from 'element-plus';

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

/** 获取设备详情 */
async function getDeviceData(deviceId: number) {
  loading.value = true;
  try {
    device.value = await getDevice(deviceId);
    await getProductData(device.value.productId);
    await getThingModelList(device.value.productId);
  } catch {
    ElMessage.error('获取设备详情失败');
  } finally {
    loading.value = false;
  }
}

/** 获取产品详情 */
async function getProductData(productId: number) {
  try {
    product.value = await getProduct(productId);
  } catch {
    ElMessage.error('获取产品详情失败');
  }
}

/** 获取物模型列表 */
async function getThingModelList(productId: number) {
  try {
    const data = await getThingModelListByProductId(productId);
    thingModelList.value = data || [];
  } catch {
    ElMessage.error('获取物模型列表失败');
    thingModelList.value = [];
  }
}

/** 初始化 */
onMounted(async () => {
  if (!id) {
    ElMessage.warning('参数错误，设备不能为空！');
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

    <ElTabs v-model="activeTab" class="mt-4">
      <ElTabPane name="info" label="设备信息">
        <DeviceDetailsInfo
          v-if="activeTab === 'info' && device.id"
          :device="device"
          :product="product"
        />
      </ElTabPane>
      <ElTabPane name="model" label="物模型数据">
        <DeviceDetailsThingModel
          v-if="activeTab === 'model' && device.id"
          :device-id="device.id"
          :thing-model-list="thingModelList"
        />
      </ElTabPane>
      <ElTabPane
        v-if="product.deviceType === DeviceTypeEnum.GATEWAY"
        name="subDevice"
        label="子设备管理"
      >
        <DeviceDetailsSubDevice
          v-if="activeTab === 'subDevice' && device.id"
          :device-id="device.id"
        />
      </ElTabPane>
      <ElTabPane name="log" label="设备消息">
        <DeviceDetailsMessage
          v-if="activeTab === 'log' && device.id"
          :device-id="device.id"
        />
      </ElTabPane>
      <ElTabPane name="simulator" label="模拟设备">
        <DeviceDetailsSimulator
          v-if="activeTab === 'simulator' && device.id"
          :device="device"
          :product="product"
          :thing-model-list="thingModelList"
        />
      </ElTabPane>
      <ElTabPane name="config" label="设备配置">
        <DeviceDetailConfig
          v-if="activeTab === 'config' && device.id"
          :device="device"
          @success="() => getDeviceData(id)"
        />
      </ElTabPane>
      <ElTabPane
        v-if="
          [
            ProtocolTypeEnum.MODBUS_TCP_CLIENT,
            ProtocolTypeEnum.MODBUS_TCP_SERVER,
          ].includes(product.protocolType as ProtocolTypeEnum)
        "
        name="modbus"
        label="Modbus 配置"
      >
        <DeviceModbusConfig
          v-if="activeTab === 'modbus' && device.id"
          :device="device"
          :product="product"
          :thing-model-list="thingModelList"
        />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
