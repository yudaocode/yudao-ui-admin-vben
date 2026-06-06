<script lang="ts" setup>
import type { FormType } from '../data';

import ProductMediaList from './product-media-list.vue';

defineProps<{
  formType?: FormType;
  itemId: number;
}>();
</script>

<template>
  <ProductMediaList :form-type="formType" :item-id="itemId" kind="SIP" />
</template>
