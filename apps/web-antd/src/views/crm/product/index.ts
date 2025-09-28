import { defineAsyncComponent } from 'vue';

export const ProductDetailsInfo = defineAsyncComponent(
  () => import('./detail/modules/info.vue'),
);

export const ProductDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);

export const ProductEditTable = defineAsyncComponent(
  () => import('./modules/product-table.vue'),
);
