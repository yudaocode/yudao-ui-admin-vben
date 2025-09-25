import { defineAsyncComponent } from 'vue';

export const ContactDetailsInfo = defineAsyncComponent(
  () => import('./detail/modules/detail-info.vue'),
);

export const ContactForm = defineAsyncComponent(
  () => import('./modules/form.vue'),
);

export const ContactDetails = defineAsyncComponent(
  () => import('./detail/index.vue'),
);

export const ContactDetailsList = defineAsyncComponent(
  () => import('./detail/modules/detail-list.vue'),
);
