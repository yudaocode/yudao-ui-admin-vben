<!-- add by puhui999：vxe table 工具栏二次封装，提供给 vxe 原生列表使用 -->
<script setup lang="ts">
import type { VxeToolbarInstance } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { useContentMaximize, useRefresh } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Tooltip } from 'ant-design-vue';

import { VxeToolbar } from '#/adapter/vxe-table';

/** 列表工具栏封装 */
defineOptions({ name: 'TableToolbar' });

const props = defineProps<{
  hiddenSearch: boolean;
}>();

const emits = defineEmits(['update:hiddenSearch']);

const toolbarRef = ref<VxeToolbarInstance>();
const { toggleMaximizeAndTabbarHidden, contentIsMaximize } =
  useContentMaximize();
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
      <Tooltip placement="bottom">
        <template #title>
          <div class="max-w-52">搜索</div>
        </template>
        <Button
          class="ml-2 font-normal"
          shape="circle"
          @click="onHiddenSearchBar"
        >
          <IconifyIcon icon="lucide:search" :size="15" />
        </Button>
      </Tooltip>
      <Tooltip placement="bottom">
        <template #title>
          <div class="max-w-52">刷新</div>
        </template>
        <Button class="ml-2 font-medium" shape="circle" @click="refresh">
          <IconifyIcon icon="lucide:refresh-cw" :size="15" />
        </Button>
      </Tooltip>
      <Tooltip placement="bottom">
        <template #title>
          <div class="max-w-52">
            {{ contentIsMaximize ? '还原' : '全屏' }}
          </div>
        </template>
        <Button
          class="ml-2 font-medium"
          shape="circle"
          @click="toggleMaximizeAndTabbarHidden"
        >
          <IconifyIcon
            :icon="contentIsMaximize ? 'lucide:minimize' : 'lucide:maximize'"
            :size="15"
          />
        </Button>
      </Tooltip>
    </template>
  </VxeToolbar>
</template>
