<script lang="ts" setup>
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { Divider } from 'ant-design-vue';

import { useDescription } from '#/components/description';
import { useFollowUpDetailSchema } from '#/views/crm/followup/data';

import { useDetailBaseSchema } from './detail-data';

defineProps<{
  receivable: CrmReceivableApi.Receivable; // 收款信息
}>();

const [BaseDescription] = useDescription({
  componentProps: {
    title: '基本信息',
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailBaseSchema(),
});

const [SystemDescription] = useDescription({
  componentProps: {
    title: '系统信息',
    bordered: false,
    column: 3,
    class: 'mx-4',
  },
  schema: useFollowUpDetailSchema(),
});
</script>

<template>
  <div class="p-4">
    <BaseDescription :data="receivable" />
    <Divider />
    <SystemDescription :data="receivable" />
  </div>
</template>
