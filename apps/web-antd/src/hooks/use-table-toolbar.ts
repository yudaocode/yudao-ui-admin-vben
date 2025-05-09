import type { VxeTableInstance } from '#/adapter/vxe-table';
import type { TableToolbar } from '#/components/table-toolbar';

import { ref, watch } from 'vue';

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
      await table.connect(tableToolbar.getToolbarRef()!);
      isBound.value = true;
    }
  }

  watch(
    () => tableRef.value,
    (val) => {
      if (!val || isBound.value) return;
      bindTableToolbar();
    },
    { immediate: true },
  );

  return {
    hiddenSearchBar,
    tableToolbarRef,
    tableRef,
  };
}
