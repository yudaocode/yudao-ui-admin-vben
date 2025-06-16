import { defineAsyncComponent } from 'vue';

export const ContractDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const ContractForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const ContractDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const ContractDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);
