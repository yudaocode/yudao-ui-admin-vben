import { defineAsyncComponent } from 'vue';

export const BusinessDetailsList = defineAsyncComponent(
  () => import('./detail-list.vue'),
);
