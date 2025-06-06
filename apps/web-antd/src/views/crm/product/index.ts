import { defineAsyncComponent } from 'vue';

export const ProductDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const ProductForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const ProductDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const ProductDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);

export const ProductEditTable = defineAsyncComponent(
  () => import('./modules/product-table.vue'),
);
