import { defineAsyncComponent } from 'vue';

// TODO @xingyu：我直接引入，貌似没问题呀。
// TODO @xingyu：apps/web-antd/src/views/crm/followup/index.ts 走的异步组件，不过名字是 FollowUp 没 Async。可能要一起讨论怎么保持相对的一致性
export const AsyncOperateLog = defineAsyncComponent(
  () => import('./operate-log.vue'),
);

export { default as OperateLog } from './operate-log.vue';

export type { OperateLogProps } from './typing';
