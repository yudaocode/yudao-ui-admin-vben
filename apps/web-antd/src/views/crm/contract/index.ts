import { defineAsyncComponent } from 'vue';

export const ContractDetailsList = defineAsyncComponent(
  () => import('./components/detail-list.vue'),
);
