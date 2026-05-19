<script setup lang="ts">
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { Card } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../../data';

/** IoT OTA 固件基本信息 */
// TODO DONE @AI：不需要；script setup 默认用文件名生成 __name（这里是 info），devtools 能识别；跟之前 upgrade-statistics / list 处理一致
defineProps<{
  firmware: IoTOtaFirmwareApi.Firmware;
  loading?: boolean;
}>();

const [Description] = useDescription({
  bordered: true,
  column: 3,
  schema: useDetailSchema(),
});
</script>

<template>
  <Card title="固件信息" :loading="loading">
    <Description :data="firmware" />
  </Card>
</template>
