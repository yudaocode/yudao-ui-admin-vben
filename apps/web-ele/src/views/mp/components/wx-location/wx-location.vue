<!--
  【微信消息 - 定位】TODO @Dhb52 目前未启用；；；；@hw：看看目前是不是没用起来哈？
-->
<script lang="ts" setup>
import type { WxLocationProps } from './types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

// TODO @dylan：@hw：apps/web-antd/src/views/mall/trade/delivery/pickUpStore/modules/form.vue 参考这个，从后端拿 key 哈
import { ElCol, ElLink, ElRow } from 'element-plus';

defineOptions({ name: 'Location' });

const props = withDefaults(defineProps<WxLocationProps>(), {
  qqMapKey: 'TVDBZ-TDILD-4ON4B-PFDZA-RNLKH-VVF6E', // QQ 地图的密钥 https://lbs.qq.com/service/staticV2/staticGuide/staticDoc
});

const mapUrl = computed(() => {
  return `https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${props.locationY}&pointy=${props.locationX}&name=${props.label}&ref=yudao`;
});

const mapImageUrl = computed(() => {
  return `https://apis.map.qq.com/ws/staticmap/v2/?zoom=10&markers=color:blue|label:A|${props.locationX},${props.locationY}&key=${props.qqMapKey}&size=250*180`;
});

defineExpose({
  locationX: props.locationX,
  locationY: props.locationY,
  label: props.label,
  qqMapKey: props.qqMapKey,
});
</script>

<template>
  <!-- 微信消息 - 定位 -->
  <div>
    <ElLink type="primary" target="_blank" :href="mapUrl">
      <ElCol>
        <ElRow>
          <img :src="mapImageUrl" alt="地图位置" />
        </ElRow>
        <ElRow>
          <IconifyIcon icon="ep:location" />
          {{ label }}
        </ElRow>
      </ElCol>
    </ElLink>
  </div>
</template>
