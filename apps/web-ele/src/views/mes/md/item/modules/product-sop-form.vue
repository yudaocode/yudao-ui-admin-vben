<script lang="ts" setup>
import ProductMediaList from './product-media-list.vue';

defineProps<{
  formType?: string;
  itemId: number;
}>();
</script>

<template>
  <ProductMediaList :form-type="formType" :item-id="itemId" kind="SOP" />
</template>
