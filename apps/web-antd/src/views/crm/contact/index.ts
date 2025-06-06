import { defineAsyncComponent } from 'vue';

export const ContactDetailsInfo = defineAsyncComponent(
  () => import('./modules/detail-info.vue'),
);

export const ContactForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const ContactDetails = defineAsyncComponent(
  () => import('./modules/detail.vue'),
);

export const ContactDetailsList = defineAsyncComponent(
  () => import('./modules/detail-list.vue'),
);
