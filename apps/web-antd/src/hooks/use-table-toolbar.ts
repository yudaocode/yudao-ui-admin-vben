import type { VxeTableInstance, VxeToolbarInstance } from '#/adapter/vxe-table';
import type { TableToolbar } from '#/components/table-toolbar';

import { ref, watch } from 'vue';

/**
 * vxe 原生工具栏挂载封装
 * 解决每个组件使用 vxe-table 组件时都需要写一遍的问题
 */
export function useTableToolbar() {
  const hiddenSearchBar = ref(false); // 隐藏搜索栏
  const tableToolbarRef = ref<InstanceType<typeof TableToolbar>>();
  const tableRef = ref<VxeTableInstance>();
  const isBound = ref<boolean>(false);

  /** 挂载 toolbar 工具栏 */
  async function bindTableToolbar() {
    const table = tableRef.value;
    const tableToolbar = tableToolbarRef.value;
    if (table && tableToolbar) {
      // TODO @puhui999：通过 nexttick 可以解决么？试过不得行🤣刚好列表组件出现后延迟一秒挂载很稳
      setTimeout(async () => {
        const toolbar = tableToolbar.getToolbarRef();
        if (!toolbar) {
          console.error('[toolbar 挂载失败] Table toolbar not found');
        }
        await table.connect(toolbar as VxeToolbarInstance);
        isBound.value = true;
      }, 1000); // 延迟挂载确保 toolbar 正确挂载
    }
  }

  watch(
    () => tableRef.value,
    async (val) => {
      if (!val || isBound.value) return;
      await bindTableToolbar();
    },
    { immediate: true },
  );

  return {
    hiddenSearchBar,
    tableToolbarRef,
    tableRef,
  };
}
