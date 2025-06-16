import { defineAsyncComponent } from 'vue';

export const AsyncOperateLog = defineAsyncComponent(
  () => import('./operate-log.vue'),
);

export { default as OperateLog } from './operate-log.vue';

export type { OperateLogProps } from './typing';
