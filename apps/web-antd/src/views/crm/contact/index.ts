import { defineAsyncComponent } from 'vue';

export const ContactDetailsList = defineAsyncComponent(
  () => import('./components/detail-list.vue'),
);
