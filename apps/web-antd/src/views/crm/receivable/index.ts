import { defineAsyncComponent } from 'vue';

export const ReceivableDetailsList = defineAsyncComponent(
  () => import('./components/detail-list.vue'),
);

export const ReceivablePlanDetailsInfo = defineAsyncComponent(
  () => import('./plan/modules/detail-info.vue'),
);

export const ReceivablePlanDetailsList = defineAsyncComponent(
  () => import('./plan/modules/detail-list.vue'),
);
