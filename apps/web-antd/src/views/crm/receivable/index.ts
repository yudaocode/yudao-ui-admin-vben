import { defineAsyncComponent } from 'vue';

export const ReceivableDetailsList = defineAsyncComponent(
  () => import('./components/detail-list.vue'),
);

export const ReceivablePlanDetailsInfo = defineAsyncComponent(
  () => import('./plan/detail/modules/info.vue'),
);

export const ReceivablePlanDetailsList = defineAsyncComponent(
  () => import('./plan/components/detail-list.vue'),
);
