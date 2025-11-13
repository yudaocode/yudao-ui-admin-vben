<!--
  【微信消息 - 定位】TODO @Dhb52 目前未启用；TODO @芋艿：需要测试下；
-->
<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { Col, Row } from 'ant-design-vue';

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
    // TODO @芋艿：是不是要换成全局的读取？
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
    <a
      target="_blank"
      :href="`https://map.qq.com/?type=marker&isopeninfowin=1&markertype=1&pointx=${
        locationY
      }&pointy=${locationX}&name=${label}&ref=yudao`"
    >
      <Col>
        <Row>
          <img
            :src="`https://apis.map.qq.com/ws/staticmap/v2/?zoom=10&markers=color:blue|label:A|${
              locationX
            },${locationY}&key=${qqMapKey}&size=250*180`"
          />
        </Row>
        <Row>
          <IconifyIcon icon="lucide:map-pin" />
          {{ label }}
        </Row>
      </Col>
    </a>
  </div>
</template>
