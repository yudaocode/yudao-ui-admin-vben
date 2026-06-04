<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { computed, onMounted, ref, watch } from 'vue';

import { Search } from '@vben/icons';

import { ElInput } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getToolTypeSimpleList } from '#/api/mes/tm/tool/type';

defineOptions({ name: 'TmToolTypeList' });

const emit = defineEmits<{
  select: [row?: MesTmToolTypeApi.ToolType];
}>();
const selectedId = ref<number>(); // 当前选中工具类型编号
const filterText = ref(''); // 工具类型搜索关键字
const toolTypeList = ref<MesTmToolTypeApi.ToolType[]>([]); // 工具类型列表
const filteredList = computed(() =>
  filterText.value
    ? toolTypeList.value.filter((item) => item.name?.includes(filterText.value))
    : toolTypeList.value,
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: false,
    columns: [{ field: 'name', title: '类型名称' }],
    data: [],
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isCurrent: true,
      isHover: true,
      keyField: 'id',
    },
    showHeader: false,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesTmToolTypeApi.ToolType>,
  gridEvents: {
    cellClick: ({ row }: { row: MesTmToolTypeApi.ToolType }) => {
      // 再次点击同一项：取消选中
      if (selectedId.value === row.id) {
        selectedId.value = undefined;
        gridApi.grid.clearCurrentRow();
        emit('select', undefined);
        return;
      }
      selectedId.value = row.id;
      emit('select', row);
    },
  },
});

/** 刷新工具类型列表 */
function refreshGridData() {
  gridApi.setGridOptions({ data: filteredList.value });
}

/** 加载工具类型列表 */
async function loadList() {
  toolTypeList.value = await getToolTypeSimpleList();
  refreshGridData();
}

/** 重置工具类型列表 */
function reset() {
  selectedId.value = undefined;
  filterText.value = '';
  gridApi.grid.clearCurrentRow();
  emit('select', undefined);
  refreshGridData();
}

watch(filterText, () => {
  refreshGridData();
});

onMounted(loadList);

defineExpose({ loadList, reset });
</script>

<template>
  <div class="h-full">
    <ElInput
      v-model="filterText"
      class="mb-3 w-full"
      clearable
      placeholder="搜索工具类型"
    >
      <template #prefix>
        <Search class="size-4" />
      </template>
    </ElInput>
    <Grid class="h-full" />
  </div>
</template>
