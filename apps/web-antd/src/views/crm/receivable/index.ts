import { defineAsyncComponent } from 'vue';

export const ReceivableDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const ReceivableForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const ReceivableDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const ReceivableDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);

export const ReceivablePlanDetailsInfo = defineAsyncComponent(
  () => import('./plan/modules/detail-info.vue'),
);

export const ReceivablePlanDetailsList = defineAsyncComponent(
  () => import('./plan/modules/detail-list.vue'),
);

export const ReceivablePlanDetails = defineAsyncComponent(
  () => import('./plan/modules/detail.vue'),
);
