import { defineAsyncComponent } from 'vue';

export const CustomerDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const CustomerForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const CustomerDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const DistributeForm = defineAsyncComponent(
  () => import('./poolConfig/distribute-form.vue'),
);
