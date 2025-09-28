import { defineAsyncComponent } from 'vue';

export const BusinessDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);
