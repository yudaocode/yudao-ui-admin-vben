import { defineAsyncComponent } from 'vue';

export const BusinessForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const BusinessDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const BusinessDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);

export const BusinessDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const BusinessDetailsListModal = defineAsyncComponent(
  () => import('./modules/detail-list-modal.vue'),
);

export const UpStatusForm = defineAsyncComponent(
  () => import('./modules/up-status-form.vue'),
);
