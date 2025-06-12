<script lang="ts" setup>
import type { Nullable, Recordable } from '@vben/types';

import { ref, unref } from 'vue';

import { Page } from '@vben/common-ui';

import Mode from './mode/index.vue';

defineOptions({ name: 'Index' });

const listRef = ref<Nullable<{ generateMusic: (...args: any) => void }>>(null);

function generateMusic(args: { formData: Recordable<any> }) {
  unref(listRef)?.generateMusic(args.formData);
}
</script>

<template>
  <Page>
    <div class="flex h-full items-stretch">
      <!-- 模式 -->
      <Mode class="flex-none" @generate-music="generateMusic" />
      <!-- 音频列表 -->
      <List ref="listRef" class="flex-auto" />
    </div>
  </Page>
</template>
