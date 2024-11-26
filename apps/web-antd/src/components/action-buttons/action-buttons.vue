<script setup lang="ts">
import type { ActionItem } from './types';

import { computed, type PropType, toRaw } from 'vue';

import { AccessControl } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { isBoolean, isFunction, isString } from '@vben/utils';

import { Button } from 'ant-design-vue';

defineOptions({ name: 'ActionButtons' });

const props = defineProps({
  actions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
});

function isIfShow(action: ActionItem): boolean {
  const ifShow = action.ifShow;

  let isIfShow = true;

  if (isBoolean(ifShow)) isIfShow = ifShow;

  if (isFunction(ifShow)) isIfShow = ifShow(action);

  return isIfShow;
}

const getActions = computed(() => {
  return (toRaw(props.actions) || [])
    .filter((action) => {
      return isIfShow(action);
    })
    .map((action) => {
      return {
        ...action,
        auth: isString(action.auth) ? Array.of(action.auth) : action.auth,
      };
    });
});
</script>
<template>
  <div class="flex">
    <template v-for="(action, index) in getActions" :key="index">
      <AccessControl :codes="action.auth" type="code">
        <Button class="mr-1 flex" v-bind="action" :key="index">
          <IconifyIcon
            v-if="action.preIcon"
            :class="{ 'mr-1': !!action.label }"
            :icon="action.preIcon"
            :size="14"
          />
          {{ action.label }}
          <IconifyIcon
            v-if="action.postIcon"
            :class="{ 'mr-1': !!action.label }"
            :icon="action.postIcon"
            :size="14"
          />
        </Button>
      </AccessControl>
    </template>
  </div>
</template>
<style lang="less" scoped>
.ant-btn-link {
  padding: 8px 4px;
  margin-left: 0;
}
</style>
