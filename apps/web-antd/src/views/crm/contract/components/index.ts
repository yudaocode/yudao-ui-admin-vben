import { defineAsyncComponent } from 'vue';

export const ContractDetailsList = defineAsyncComponent(
  () => import('./detail-list.vue'),
);
