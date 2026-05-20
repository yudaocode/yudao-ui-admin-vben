<script lang="ts" setup>
import ProductMediaList from './product-media-list.vue';

defineOptions({ name: 'MesMdProductSipForm' });

defineProps<{
  formType?: string;
  itemId: number;
}>();
</script>

<template>
  <ProductMediaList :form-type="formType" :item-id="itemId" kind="SIP" />
</template>
