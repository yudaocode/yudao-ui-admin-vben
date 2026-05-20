<script lang="ts" setup>
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { ElCard } from 'element-plus';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

defineProps<{
  loading?: boolean;
  task?: IoTOtaTaskApi.Task;
}>();

const [Description] = useDescription({
  border: true,
  column: 3,
  schema: useDetailSchema(),
});
</script>

<template>
  <ElCard v-loading="loading" header="任务信息">
    <Description :data="task" />
  </ElCard>
</template>
