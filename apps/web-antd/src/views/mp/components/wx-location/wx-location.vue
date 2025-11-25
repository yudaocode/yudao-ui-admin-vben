<script lang="ts" setup>
import type { WxLocationProps } from './types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Col, Row } from 'ant-design-vue';

/** 微信消息 - 定位 */
defineOptions({ name: 'WxLocation' });

// TODO @dylan：apps/web-antd/src/views/mall/trade/delivery/pickUpStore/modules/form.vue 参考这个，从后端拿 key 哈；参考 apps/web-ele/src/views/mp/components/wx-location/wx-location.vue
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
  <div>
    <a :href="mapUrl" target="_blank" class="text-primary">
      <Col>
        <Row>
          <img :src="mapImageUrl" alt="地图位置" />
        </Row>
        <Row class="mt-2">
          <IconifyIcon icon="lucide:map-pin" class="mr-1" />
          {{ label }}
        </Row>
      </Col>
    </a>
  </div>
</template>
