<script lang="ts" setup>
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { ElCard } from 'element-plus';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../../data';

defineProps<{
  firmware?: IoTOtaFirmwareApi.Firmware;
  loading?: boolean;
}>();

const [Description] = useDescription({
  border: true,
  column: 3,
  schema: useDetailSchema(),
});
</script>

<template>
  <ElCard v-loading="loading" header="固件信息">
    <Description :data="firmware" />
  </ElCard>
</template>
