<script lang="ts" setup>
import type { DocAlertProps } from './types';

import { isDocAlertEnable } from '@vben/hooks';

import { VbenIcon } from '@vben-core/shadcn-ui';
import { cn, openWindow } from '@vben-core/shared/utils';

defineOptions({
  name: 'DocAlert',
});

const props = defineProps<DocAlertProps>();

function goToUrl() {
  openWindow(props.url);
}
</script>
<template>
  <!-- Alert Component -->
  <div
    role="alert"
    v-if="isDocAlertEnable()"
    :class="
      cn(
        'border-primary bg-primary/10 relative m-1 flex w-full items-center rounded-md border p-1',
      )
    "
  >
    <span class="grid shrink-0 place-items-center">
      <VbenIcon icon="mdi:information-outline" class="text-primary size-5" />
    </span>
    <div class="text-primary w-full font-sans text-sm leading-none">
      【{{ title }}】文档地址：
      <a class="hover:text-primary" @click="goToUrl">{{ url }}</a>
    </div>
  </div>
</template>
