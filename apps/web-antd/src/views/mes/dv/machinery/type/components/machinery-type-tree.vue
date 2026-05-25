<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';
import { handleTree } from '@vben/utils';

import { Card, Input } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getMachineryTypeList } from '#/api/mes/dv/machinery/type';

const emit = defineEmits<{
  nodeClick: [row?: MesDvMachineryTypeApi.MachineryType];
}>();
const selectedId = ref<number>(); // 选中设备类型编号
const searchKeyword = ref(''); // 设备类型搜索关键字

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: false,
    columns: [{ field: 'name', title: '类型名称', treeNode: true }],
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () =>
          handleTree(
            await getMachineryTypeList({
              name: searchKeyword.value || undefined,
              status: CommonStatusEnum.ENABLE,
            }),
          ),
      },
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
    treeConfig: { parentField: 'parentId', rowField: 'id', transform: true },
  } as VxeTableGridOptions<MesDvMachineryTypeApi.MachineryType>,
  gridEvents: {
    cellClick: ({ row }: { row: MesDvMachineryTypeApi.MachineryType }) => {
      if (selectedId.value === row.id) {
        selectedId.value = undefined;
        gridApi.grid.clearCurrentRow();
        emit('nodeClick', undefined);
        return;
      }
      selectedId.value = row.id;
      emit('nodeClick', row);
    },
  },
});

/** 重置选中状态 */
function reset() {
  selectedId.value = undefined;
  searchKeyword.value = '';
  gridApi.grid.clearCurrentRow();
  emit('nodeClick', undefined);
  gridApi.query();
}

/** 搜索设备类型 */
function handleSearch() {
  gridApi.query();
}

defineExpose({ reset });
</script>

<template>
  <Card class="h-full" size="small" title="设备类型">
    <Input
      v-model:value="searchKeyword"
      allow-clear
      class="mb-3"
      placeholder="搜索设备类型"
      @change="handleSearch"
    />
    <Grid class="h-full" />
  </Card>
</template>
