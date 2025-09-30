import { defineAsyncComponent } from 'vue';

export const ReceivableDetailsList = defineAsyncComponent(
  () => import('./detail-list.vue'),
);
