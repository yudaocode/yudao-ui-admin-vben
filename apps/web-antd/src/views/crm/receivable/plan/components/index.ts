import { defineAsyncComponent } from 'vue';

export const ReceivablePlanDetailsInfo = defineAsyncComponent(
  () => import('../detail/modules/info.vue'),
);

export const ReceivablePlanDetailsList = defineAsyncComponent(
  () => import('./detail-list.vue'),
);
