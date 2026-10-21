<script lang="ts" setup>
import type { WxLocationProps } from './types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElCol, ElLink, ElRow } from 'element-plus';

import { gcj02ToBd09, MapView, toMapCoordinate } from '#/components/map';

/** 微信消息 - 定位 */
defineOptions({ name: 'WxLocation' });

const props = defineProps<WxLocationProps>();

/** 微信定位为 GCJ02，百度地图展示和外链使用 BD09 */
const point = computed(() => {
  const coordinate = toMapCoordinate(props.locationY, props.locationX);
  return coordinate
    ? gcj02ToBd09(coordinate.longitude, coordinate.latitude)
    : undefined;
});

const mapUrl = computed(() => {
  if (!point.value) {
    return undefined;
  }
  const params = new URLSearchParams({
    location: `${point.value.latitude},${point.value.longitude}`,
    title: props.label || '位置',
    content: props.label || '',
    output: 'html',
    coord_type: 'bd09ll',
    src: 'webapp.yudao.admin',
  });
  return `https://api.map.baidu.com/marker?${params.toString()}`;
});

defineExpose({
  locationX: props.locationX,
  locationY: props.locationY,
  label: props.label,
});
</script>

<template>
  <div>
    <ElLink
      type="primary"
      target="_blank"
      rel="noopener noreferrer"
      :href="mapUrl"
    >
      <ElCol>
        <ElRow v-if="point">
          <MapView
            :longitude="point.longitude"
            :latitude="point.latitude"
            class="pointer-events-none h-[180px] w-[250px]"
          />
        </ElRow>
        <ElRow>
          <IconifyIcon icon="lucide:map-pin" />
          {{ label }}
        </ElRow>
      </ElCol>
    </ElLink>
  </div>
</template>
