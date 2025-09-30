import { defineAsyncComponent } from 'vue';

export const ProductDetailsList = defineAsyncComponent(
  () => import('./detail-list.vue'),
);

export const ProductEditTable = defineAsyncComponent(
  () => import('./edit-table.vue'),
);
