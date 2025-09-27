import { defineAsyncComponent } from 'vue';

export const CustomerDetailsInfo = defineAsyncComponent(
  () => import('./detail/modules/info.vue'),
);

export const DistributeForm = defineAsyncComponent(
  () => import('./poolConfig/distribute-form.vue'),
);
