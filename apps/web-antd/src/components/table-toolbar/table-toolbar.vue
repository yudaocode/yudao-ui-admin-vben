<script setup lang="ts">
import type { VxeToolbarInstance } from 'vxe-table';

import { ref } from 'vue';

import { useContentMaximize, useRefresh } from '@vben/hooks';
import { Fullscreen, RefreshCw, Search } from '@vben/icons';

import { Button } from 'ant-design-vue';
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
      <Button class="ml-2 font-[8px]" shape="circle" @click="onHiddenSearchBar">
        <Search :size="15" />
      </Button>
      <Button class="ml-2 font-[8px]" shape="circle" @click="refresh">
        <RefreshCw :size="15" />
      </Button>
      <Button
        class="ml-2 font-[8px]"
        shape="circle"
        @click="toggleMaximizeAndTabbarHidden"
      >
        <Fullscreen :size="15" />
      </Button>
    </template>
  </VxeToolbar>
</template>
