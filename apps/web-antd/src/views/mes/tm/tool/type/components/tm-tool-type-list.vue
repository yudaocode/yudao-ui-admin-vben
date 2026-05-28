<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { computed, onMounted, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input } from 'ant-design-vue';

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
    <Input
      v-model:value="filterText"
      allow-clear
      class="mb-3 w-full"
      placeholder="搜索工具类型"
    >
      <template #prefix>
        <IconifyIcon class="size-4" icon="lucide:search" />
      </template>
    </Input>
    <Grid class="h-full" />
  </div>
</template>
