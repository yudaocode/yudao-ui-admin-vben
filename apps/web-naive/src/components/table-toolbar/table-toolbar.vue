<!-- add by puhui999：vxe table 工具栏二次封装，提供给 vxe 原生列表使用 -->
<script setup lang="ts">
import type { VxeToolbarInstance } from 'vxe-table';

import { ref } from 'vue';

import { useContentMaximize, useRefresh } from '@vben/hooks';
import { Fullscreen, RefreshCw, Search } from '@vben/icons';

import { NButton } from 'naive-ui';
import { VxeToolbar } from 'vxe-table';

/** 列表工具栏封装 */
defineOptions({ name: 'TableToolbar' });

const props = defineProps<{
  hiddenSearch: boolean;
}>();

const emits = defineEmits(['update:hiddenSearch']);

const toolbarRef = ref<VxeToolbarInstance>();
const { toggleMaximizeAndTabbarHidden } = useContentMaximize();
const { refresh } = useRefresh();

/** 隐藏搜索栏 */
function onHiddenSearchBar() {
  emits('update:hiddenSearch', !props.hiddenSearch);
}

defineExpose({
  getToolbarRef: () => toolbarRef.value,
});
</script>

<template>
  <VxeToolbar ref="toolbarRef" custom>
    <template #toolPrefix>
      <slot></slot>
      <!-- TODO @puhui999：貌似 icon 没和 vxe 对上。可以考虑用 /Users/yunai/Java/yudao-ui-admin-vben-v5/packages/icons/src/iconify  -->
      <NButton
        class="ml-2 font-[8px]"
        shape="circle"
        @click="onHiddenSearchBar"
      >
        <Search :size="15" />
      </NButton>
      <NButton class="ml-2 font-[8px]" shape="circle" @click="refresh">
        <RefreshCw :size="15" />
      </NButton>
      <NButton
        class="ml-2 font-[8px]"
        shape="circle"
        @click="toggleMaximizeAndTabbarHidden"
      >
        <Fullscreen :size="15" />
      </NButton>
    </template>
  </VxeToolbar>
</template>
