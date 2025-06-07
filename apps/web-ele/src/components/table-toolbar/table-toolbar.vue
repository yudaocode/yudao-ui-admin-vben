<!-- add by puhui999：vxe table 工具栏二次封装，提供给 vxe 原生列表使用 -->
<script setup lang="ts">
import type { VxeToolbarInstance } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { useContentMaximize, useRefresh } from '@vben/hooks';
import { Expand, MsRefresh, Search, TMinimize } from '@vben/icons';

import { ElButton, ElTooltip } from 'element-plus';

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
      <ElTooltip placement="bottom">
        <template #content>
          <div class="max-w-[200px]">搜索</div>
        </template>
        <ElButton class="ml-2 font-[8px]" circle @click="onHiddenSearchBar">
          <Search :size="15" />
        </ElButton>
      </ElTooltip>
      <ElTooltip placement="bottom">
        <template #content>
          <div class="max-w-[200px]">刷新</div>
        </template>
        <ElButton class="ml-2 font-[8px]" circle @click="refresh">
          <MsRefresh :size="15" />
        </ElButton>
      </ElTooltip>
      <ElTooltip placement="bottom">
        <template #content>
          <div class="max-w-[200px]">
            {{ contentIsMaximize ? '还原' : '全屏' }}
          </div>
        </template>
        <ElButton
          class="ml-2 font-[8px]"
          circle
          @click="toggleMaximizeAndTabbarHidden"
        >
          <Expand v-if="!contentIsMaximize" :size="15" />
          <TMinimize v-else :size="15" />
        </ElButton>
      </ElTooltip>
    </template>
  </VxeToolbar>
</template>
