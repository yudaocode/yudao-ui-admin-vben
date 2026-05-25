<script lang="ts" setup>
import type { NumberDictDataType } from '@vben/hooks';

import type { IotDeviceApi } from '#/api/iot/device/device';

import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DeviceStateEnum, DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';

import { Card, Empty, Spin } from 'ant-design-vue';

import { getDeviceLocationList } from '#/api/iot/device/device';
import { loadBaiduMapSdk } from '#/components/map';

defineOptions({ name: 'DeviceMapCard' });

const router = useRouter();
const mapContainerRef = ref<HTMLElement>(); // 地图容器节点
let mapInstance: any = null; // 百度地图实例
const loading = ref(true); // 加载状态
const deviceList = ref<IotDeviceApi.Device[]>([]); // 设备分布列表

const hasData = computed(() => deviceList.value.length > 0); // 是否有数据

const stateOptions = computed(() =>
  getDictOptions(
    DICT_TYPE.IOT_DEVICE_STATE,
    'number',
  ) as NumberDictDataType[],
); // 状态图例列表（从字典获取）

const stateColorMap: Record<number, string> = {
  [DeviceStateEnum.INACTIVE]: '#EAB308', // 待激活 - 黄色
  [DeviceStateEnum.ONLINE]: '#22C55E', // 在线 - 绿色
  [DeviceStateEnum.OFFLINE]: '#9CA3AF', // 离线 - 灰色
}; // 设备状态颜色映射

/** 获取设备状态配置；名称走字典，颜色用本地映射 */
function getStateConfig(state: number): { color: string; name: string } {
  return {
    name: getDictLabel(DICT_TYPE.IOT_DEVICE_STATE, state) || '未知',
    color: stateColorMap[state] || '#909399',
  };
}

/** 创建自定义标记点图标 */
function createMarkerIcon(color: string, isOnline: boolean) {
  const size = isOnline ? 24 : 20;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
      ${isOnline ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>` : ''}
    </svg>
  `;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new window.BMapGL.Icon(url, new window.BMapGL.Size(size, size), {
    anchor: new window.BMapGL.Size(size / 2, size / 2),
  });
}

/** 初始化地图 */
function initMap() {
  if (!mapContainerRef.value || !window.BMapGL) {
    return;
  }

  // 销毁旧实例
  if (mapInstance) {
    mapInstance.destroy?.();
    mapInstance = null;
  }

  // 创建地图实例，默认以中国为中心
  mapInstance = new window.BMapGL.Map(mapContainerRef.value);
  mapInstance.centerAndZoom(new window.BMapGL.Point(106, 37.5), 5);
  mapInstance.enableScrollWheelZoom();

  // 添加控件
  mapInstance.addControl(new window.BMapGL.ScaleControl());
  mapInstance.addControl(new window.BMapGL.ZoomControl());

  // 添加设备标记点
  deviceList.value.forEach((device) => {
    const config = getStateConfig(device.state!);
    const isOnline = device.state === DeviceStateEnum.ONLINE;
    const point = new window.BMapGL.Point(device.longitude, device.latitude);

    // 创建标记
    const marker = new window.BMapGL.Marker(point, {
      icon: createMarkerIcon(config.color, isOnline),
    });

    // 创建信息窗口内容
    const infoContent = `
      <div style="padding: 8px; min-width: 180px;">
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${device.nickname || device.deviceName}</div>
        <div style="color: #666; font-size: 12px; line-height: 1.8;">
          <div>产品: ${device.productName || '-'}</div>
          <div>状态: <span style="color: ${config.color}; font-weight: 500;">${config.name}</span></div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <a href="javascript:void(0)" class="device-link" data-id="${device.id}" style="color: #1890ff; font-size: 12px; text-decoration: none;">点击查看详情 →</a>
        </div>
      </div>
    `;

    // 点击标记显示信息窗口
    marker.addEventListener('click', () => {
      const infoWindow = new window.BMapGL.InfoWindow(infoContent, {
        width: 220,
        height: 140,
        title: '',
      });

      // 信息窗口打开后绑定链接点击事件
      infoWindow.addEventListener('open', () => {
        setTimeout(() => {
          const link = document.querySelector(
            '.BMap_bubble_content .device-link',
          );
          if (!link) {
            return;
          }
          link.addEventListener('click', (e) => {
            e.preventDefault();
            if (device.id === undefined || device.id === null) {
              return;
            }
            router.push({
              name: 'IoTDeviceDetail',
              params: { id: device.id },
            });
          });
        }, 100);
      });

      mapInstance.openInfoWindow(infoWindow, point);
    });

    mapInstance.addOverlay(marker);
  });
}

/** 加载设备数据 */
async function loadDeviceData() {
  loading.value = true;
  try {
    deviceList.value = await getDeviceLocationList();
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
async function init() {
  await loadDeviceData();
  if (!hasData.value) {
    return;
  }
  await loadBaiduMapSdk();
  // 等待 v-show 容器渲染完成；SDK 缓存命中时上一行会同步 resolve，DOM 来不及切换
  await nextTick();
  initMap();
}

/** 组件挂载时初始化 */
onMounted(() => {
  init();
});

/** 组件卸载时销毁地图实例 */
onUnmounted(() => {
  if (mapInstance) {
    mapInstance.destroy?.();
    mapInstance = null;
  }
});
</script>

<template>
  <Card class="h-full" title="设备分布地图">
    <template #extra>
      <div class="flex items-center gap-4 text-sm">
        <span
          v-for="item in stateOptions"
          :key="item.value"
          class="flex items-center gap-1"
        >
          <span
            class="inline-block h-3 w-3 rounded-full"
            :style="{
              backgroundColor: stateColorMap[item.value],
            }"
          ></span>
          <span class="text-gray-500">{{ item.label }}</span>
        </span>
      </div>
    </template>
    <Spin v-if="loading" class="flex h-[500px] items-center justify-center" />
    <Empty
      v-else-if="!hasData"
      class="h-[500px]"
      description="暂无设备位置数据"
    />
    <div
      v-show="hasData && !loading"
      ref="mapContainerRef"
      class="h-[500px] w-full"
    ></div>
  </Card>
</template>
