<script lang="ts" setup>
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { Card } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../../data';

defineProps<{
  firmware?: IoTOtaFirmwareApi.Firmware;
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
