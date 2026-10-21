<!-- 地图选择弹窗组件：基于百度地图 GL 实现 -->
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { BAIDU_MAP_FRAME_READY, buildBaiduMapFrameHtml } from './utils';

const emit = defineEmits<{
  confirm: [
    data: {
      address: string;
      latitude: string;
      longitude: string;
    },
  ];
}>();

const mapFrameRef = ref<HTMLIFrameElement>(); // 地图 iframe
const mapFrameHtml = buildBaiduMapFrameHtml(); // 地图 iframe 页面
let mapApi: any = null; // 当前地图 iframe 中的百度地图 GL 命名空间，所有 SDK 对象都由它创建
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

/**
 * 弹窗打开后显示地图 iframe，iframe 中的 SDK 加载完成后由 handleFrameMessage 初始化地图
 *
 * 百度 GL SDK 的 destroy 会延迟清空实例并清理页面级共享样式，仍在排队的回调随后读取已清空的数据而抛错，公开 API 没有可等待的完成时机；
 * 因此地图与 SDK 运行在独立 iframe 中，关闭弹窗时移除 iframe，由浏览器回收其中的实例、定时器与 Worker，不调用 destroy
 */
function handleDialogOpened() {
  state.mapContainerReady = true;
}

/** 弹窗关闭后移除地图 iframe */
function handleDialogClosed() {
  state.map = null;
  state.mapMarker = null;
  state.geocoder = null;
  state.loading = false;
  state.mapContainerReady = false;
  mapApi = null;
}

/** 地图 iframe 的 SDK 加载完成后初始化地图，只处理当前 iframe 发出的消息 */
function handleFrameMessage(event: MessageEvent) {
  const frameWindow = mapFrameRef.value?.contentWindow as any;
  if (
    !frameWindow ||
    event.source !== frameWindow ||
    event.data?.type !== BAIDU_MAP_FRAME_READY ||
    state.map
  ) {
    return;
  }
  const container = frameWindow.document.querySelector('#map');
  if (!container) {
    return;
  }
  mapApi = frameWindow.BMapGL;
  initMapInstance(container);
}

/** 初始化地图实例 */
function initMapInstance(container: HTMLElement) {
  // 初始化地图和地理编码器
  initMap(container);
  initGeocoder();

  // 监听地图点击事件
  state.map.addEventListener('click', (e: any) => {
    const point = e.latlng;
    state.lonLat = `${point.lng},${point.lat}`;
    regeoCode(state.lonLat);
  });

  // 如果有初始经纬度，加载标记点
  if (
    Number.isFinite(initLongitude.value) &&
    Number.isFinite(initLatitude.value)
  ) {
    const lonLat = `${initLongitude.value},${initLatitude.value}`;
    regeoCode(lonLat);
  }
}

/** 初始化地图 */
function initMap(container: HTMLElement) {
  state.map = new mapApi.Map(container);
  state.map.centerAndZoom(new mapApi.Point(116.404, 39.915), 11);
  state.map.enableScrollWheelZoom();
  state.map.disableDoubleClickZoom();

  state.map.addControl(new mapApi.NavigationControl());
  state.map.addControl(new mapApi.ScaleControl());
  state.map.addControl(new mapApi.ZoomControl());
}

/** 初始化地理编码器 */
function initGeocoder() {
  state.geocoder = new mapApi.Geocoder();
}

/** 搜索地址 */
function autoSearch(queryValue: string) {
  if (!queryValue || !mapApi) {
    state.mapAddressOptions = [];
    return;
  }

  state.loading = true;

  // noinspection JSUnusedGlobalSymbols
  const localSearch = new mapApi.LocalSearch(state.map, {
    onSearchComplete: (results: any) => {
      state.loading = false;
      const temp: any[] = [];

      if (results && results._pois) {
        results._pois.forEach((p: any) => {
          const point = p.point;
          if (
            point &&
            Number.isFinite(point.lng) &&
            Number.isFinite(point.lat)
          ) {
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

  const point = new mapApi.Point(lnglat[0], lnglat[1]);
  state.mapMarker = new mapApi.Marker(point);

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
  const point = new mapApi.Point(lnglat[0], lnglat[1]);
  state.map.centerAndZoom(point, 16);

  setMarker(lnglat);
  getAddress(lnglat);
}

/** 根据经纬度获取地址信息 */
function getAddress(lnglat: string[]) {
  const point = new mapApi.Point(lnglat[0], lnglat[1]);
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

onMounted(() => {
  window.addEventListener('message', handleFrameMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleFrameMessage);
});

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
  state.longitude = Number.isFinite(longitude) ? String(longitude) : '';
  state.latitude = Number.isFinite(latitude) ? String(latitude) : '';
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
      <ElForm label-width="80px">
        <ElFormItem label="定位位置">
          <ElSelect
            v-model="state.address"
            :filter-method="autoSearch"
            :loading="state.loading"
            class="w-full"
            clearable
            filterable
            placeholder="可输入地址查询经纬度"
            remote
            @change="handleAddressSelect"
          >
            <ElOption
              v-for="item in state.mapAddressOptions"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <!-- 第二行：坐标显示 -->
        <ElFormItem label="当前坐标">
          <div class="flex gap-2">
            <ElInput
              :model-value="state.longitude"
              disabled
              style="width: 200px"
            >
              <template #prepend>经度</template>
            </ElInput>
            <ElInput
              :model-value="state.latitude"
              disabled
              style="width: 200px"
            >
              <template #prepend>纬度</template>
            </ElInput>
          </div>
        </ElFormItem>
      </ElForm>
      <!-- 第三行：地图 -->
      <iframe
        v-if="state.mapContainerReady && mapFrameHtml"
        ref="mapFrameRef"
        :srcdoc="mapFrameHtml"
        class="mt-[10px] block h-[400px] w-full border-0"
        title="百度地图"
      ></iframe>
      <div
        v-else
        class="mt-[10px] flex h-[400px] w-full items-center justify-center"
      >
        <span class="text-gray-400">地图加载中...</span>
      </div>
    </div>
    <div class="mt-4 flex justify-end gap-2">
      <ElButton type="primary" @click="handleConfirm">确 定</ElButton>
      <ElButton @click="modalApi.close()">取 消</ElButton>
    </div>
  </Modal>
</template>
