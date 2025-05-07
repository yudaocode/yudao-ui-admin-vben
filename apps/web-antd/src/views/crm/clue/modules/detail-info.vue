<script lang="ts" setup>
import type { CrmClueApi } from '#/api/crm/clue';

import { Divider } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useDetailBaseSchema, useDetailSystemSchema } from '../data';

defineOptions({ name: 'CrmClueDetailsInfo' });

const { clue } = defineProps<{
  clue: CrmClueApi.Clue; // 线索信息
}>();

const [BaseDescription] = useDescription({
  componentProps: {
    title: '基本信息',
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailBaseSchema(),
  data: clue,
});

const [SystemDescription] = useDescription({
  componentProps: {
    title: '系统信息',
    bordered: false,
    column: 3,
    class: 'mx-4',
  },
  schema: useDetailSystemSchema(),
  data: clue,
});
</script>

<template>
  <div class="p-4">
    <BaseDescription />
    <Divider />
    <SystemDescription />
  </div>
</template>
