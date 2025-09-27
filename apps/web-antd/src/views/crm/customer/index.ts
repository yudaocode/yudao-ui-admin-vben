import { defineAsyncComponent } from 'vue';

export const DistributeForm = defineAsyncComponent(
  () => import('./poolConfig/distribute-form.vue'),
);
