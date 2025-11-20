<!--
  【微信消息 - 定位】TODO @Dhb52 目前未启用
-->
<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { ElCol, ElLink, ElRow } from 'element-plus';

defineOptions({ name: 'Location' });

const props = defineProps({
  locationX: {
    required: true,
    type: Number,
  },
  locationY: {
    required: true,
    type: Number,
  },
  label: {
    // 地名
    required: true,
    type: String,
  },
  qqMapKey: {
    // QQ 地图的密钥 https://lbs.qq.com/service/staticV2/staticGuide/staticDoc
    required: false,
    type: String,
    default: 'TVDBZ-TDILD-4ON4B-PFDZA-RNLKH-VVF6E', // 需要自定义
  },
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
    <ElLink
      type="primary"
      target="_blank"
      :href="`https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${
        locationY
      }&pointy=${locationX}&name=${label}&ref=yudao`"
    >
      <ElCol>
        <ElRow>
          <img
            :src="`https://apis.map.qq.com/ws/staticmap/v2/?zoom=10&markers=color:blue|label:A|${
              locationX
            },${locationY}&key=${qqMapKey}&size=250*180`"
          />
        </ElRow>
        <ElRow>
          <IconifyIcon icon="ep:location" />
          {{ label }}
        </ElRow>
      </ElCol>
    </ElLink>
  </div>
</template>
