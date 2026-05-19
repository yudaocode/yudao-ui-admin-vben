<script lang="ts" setup>
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { Card } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

defineProps<{
  loading?: boolean;
  task?: IoTOtaTaskApi.Task;
}>();

const [Description] = useDescription({
  bordered: true,
  column: 3,
  schema: useDetailSchema(),
});
</script>

<template>
  <Card title="任务信息" :loading="loading">
    <Description :data="task" />
  </Card>
</template>
