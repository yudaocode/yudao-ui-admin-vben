<script lang="ts" setup>
import type { CrmProductApi } from '#/api/crm/product';

import { useDescription } from '#/components/description';

import { useDetailBaseSchema } from './detail-data';

defineProps<{
  product: CrmProductApi.Product; // 产品信息
}>();

const [ProductDescription] = useDescription({
  componentProps: {
    title: '基本信息',
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailBaseSchema(),
});
</script>

<template>
  <div class="p-4">
    <ProductDescription :data="product" />
  </div>
</template>
