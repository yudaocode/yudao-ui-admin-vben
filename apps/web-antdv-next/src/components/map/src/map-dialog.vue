<!-- 地图选择弹窗组件：基于百度地图 GL 实现 -->
<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Form, Input, Select, Space } from 'ant-design-vue';

import { loadBaiduMapSdk } from './utils';

const emit = defineEmits<{
  confirm: [
    data: {
      address: string;
      latitude: string;
      longitude: string;
    },
  ];
}>();

const mapContainerRef = ref<HTMLElement>();
const state = reactive({
  lonLat: '', // 经纬度字符串，格式为 "经度,纬度"
  address: '', // 地址信息
  loading: false, // 地址搜索加载状态
  latitude: '', // 纬度
  longitude: '', // 经度
  map: null as any, // 百度地图实例
  mapAddressOptions: [] as any[], // 地址搜索选项
  mapMarker: null as any, // 地图标记点
  geocoder: null as any, // 地理编码器实例
  mapContainerReady: false, // 地图容器是否准备好
});

// 初始经纬度（打开弹窗时传入）
const initLongitude = ref<number | undefined>();
const initLatitude = ref<number | undefined>();

/** 弹窗打开动画完成后初始化地图 */
async function handleDialogOpened() {
  // 先显示地图容器
  state.mapContainerReady = true;

  // 等待下一个 DOM 更新周期，确保地图容器已渲染
  await nextTick();
  // 加载百度地图 SDK
  await loadBaiduMapSdk();
  initMapInstance();
}

/** 弹窗关闭后清理地图 */
function handleDialogClosed() {
  // 销毁地图实例
  if (state.map) {
    state.map.destroy?.();
    state.map = null;
  }
  state.mapMarker = null;
  state.geocoder = null;
  state.mapContainerReady = false;
}

/** 初始化地图实例 */
function initMapInstance() {
  if (!mapContainerRef.value) {
    return;
  }

  // 初始化地图和地理编码器
  initMap();
  initGeocoder();

  // 监听地图点击事件
  state.map.addEventListener('click', (e: any) => {
    const point = e.latlng;
    state.lonLat = `${point.lng},${point.lat}`;
    regeoCode(state.lonLat);
  });

  // 如果有初始经纬度，加载标记点
  if (initLongitude.value && initLatitude.value) {
    const lonLat = `${initLongitude.value},${initLatitude.value}`;
    regeoCode(lonLat);
  }
}

/** 初始化地图 */
function initMap() {
  state.map = new window.BMapGL.Map(mapContainerRef.value);
  state.map.centerAndZoom(new window.BMapGL.Point(116.404, 39.915), 11);
  state.map.enableScrollWheelZoom();
  state.map.disableDoubleClickZoom();

  state.map.addControl(new window.BMapGL.NavigationControl());
  state.map.addControl(new window.BMapGL.ScaleControl());
  state.map.addControl(new window.BMapGL.ZoomControl());
}

/** 初始化地理编码器 */
function initGeocoder() {
  state.geocoder = new window.BMapGL.Geocoder();
}

/** 搜索地址 */
function autoSearch(queryValue: string) {
  if (!queryValue) {
    state.mapAddressOptions = [];
    return;
  }

  state.loading = true;

  // noinspection JSUnusedGlobalSymbols
  const localSearch = new window.BMapGL.LocalSearch(state.map, {
    onSearchComplete: (results: any) => {
      state.loading = false;
      const temp: any[] = [];

      if (results && results._pois) {
        results._pois.forEach((p: any) => {
          const point = p.point;
          if (point && point.lng && point.lat) {
            temp.push({
              name: p.title,
              value: `${point.lng},${point.lat}`,
            });
          }
        });
      }

      state.mapAddressOptions = temp;
    },
  });

  localSearch.search(queryValue);
}

/** 处理地址选择 */
function handleAddressSelect(value: string) {
  if (value) {
    regeoCode(value);
  }
}

/** 添加标记点 */
function setMarker(lnglat: string[]) {
  if (!lnglat) {
    return;
  }

  if (state.mapMarker !== null) {
    state.map.removeOverlay(state.mapMarker);
  }

  const point = new window.BMapGL.Point(lnglat[0], lnglat[1]);
  state.mapMarker = new window.BMapGL.Marker(point);

  state.map.addOverlay(state.mapMarker);
  state.map.centerAndZoom(point, 16);
}

/** 经纬度转地址、添加标记点 */
function regeoCode(lonLat: string) {
  if (!lonLat) {
    return;
  }
  const lnglat = lonLat.split(',');
  if (lnglat.length !== 2) {
    return;
  }

  state.longitude = lnglat[0]!;
  state.latitude = lnglat[1]!;
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1]);
  state.map.centerAndZoom(point, 16);

  setMarker(lnglat);
  getAddress(lnglat);
}

/** 根据经纬度获取地址信息 */
function getAddress(lnglat: string[]) {
  const point = new window.BMapGL.Point(lnglat[0], lnglat[1]);
  state.geocoder.getLocation(point, (result: any) => {
    if (result && result.address) {
      state.address = result.address;
    }
  });
}

/** 确认选择 */
function handleConfirm() {
  if (state.longitude && state.latitude) {
    emit('confirm', {
      longitude: state.longitude,
      latitude: state.latitude,
      address: state.address,
    });
  }
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      handleDialogOpened();
    } else {
      handleDialogClosed();
    }
  },
});

/** 打开弹窗 */
function open(longitude?: number, latitude?: number) {
  initLongitude.value = longitude;
  initLatitude.value = latitude;
  state.longitude = longitude ? String(longitude) : '';
  state.latitude = latitude ? String(latitude) : '';
  state.address = '';
  state.mapAddressOptions = [];
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :footer="false" class="w-[700px]" title="百度地图">
    <div class="w-full">
      <!-- 第一行：位置搜索 -->
      <Form :label-col="{ span: 4 }">
        <Form.Item label="定位位置">
          <Select
            v-model:value="state.address"
            :filter-option="false"
            :loading="state.loading"
            :options="
              state.mapAddressOptions.map((item) => ({
                label: item.name,
                value: item.value,
              }))
            "
            allow-clear
            class="w-full"
            placeholder="可输入地址查询经纬度"
            show-search
            @search="autoSearch"
            @select="handleAddressSelect"
          />
        </Form.Item>
        <!-- 第二行：坐标显示 -->
        <Form.Item label="当前坐标">
          <Space>
            <Input
              :value="state.longitude"
              addon-before="经度"
              disabled
              style="width: 180px"
            />
            <Input
              :value="state.latitude"
              addon-before="纬度"
              disabled
              style="width: 180px"
            />
          </Space>
        </Form.Item>
      </Form>
      <!-- 第三行：地图 -->
      <div
        v-if="state.mapContainerReady"
        ref="mapContainerRef"
        class="mt-[10px] h-[400px] w-full"
      ></div>
      <div
        v-else
        class="mt-[10px] flex h-[400px] w-full items-center justify-center"
      >
        <span class="text-gray-400">地图加载中...</span>
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <Button type="primary" @click="handleConfirm">确 定</Button>
      <Button @click="modalApi.close()">取 消</Button>
    </div>
  </Modal>
</template>
