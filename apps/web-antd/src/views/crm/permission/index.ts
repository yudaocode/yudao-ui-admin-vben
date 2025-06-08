import { defineAsyncComponent } from 'vue';

export const PermissionList = defineAsyncComponent(
  () => import('./modules/permission-list.vue'),
);

export const PermissionForm = defineAsyncComponent(
  () => import('./modules/permission-form.vue'),
);

export const TransferForm = defineAsyncComponent(
  () => import('./modules/transfer-form.vue'),
);
