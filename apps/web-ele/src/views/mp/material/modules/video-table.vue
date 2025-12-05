<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMaterialApi } from '#/api/mp/material';

import { nextTick, watch } from 'vue';

import { $t } from '@vben/locales';
import { openWindow } from '@vben/utils';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { WxVideoPlayer } from '#/views/mp/components';

import { useVideoGridColumns } from './data';

const props = defineProps<{
  list: MpMaterialApi.Material[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
  refresh: [];
}>();

const columns = useVideoGridColumns();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
    showOverflow: 'tooltip',
    proxyConfig: {
      ajax: {
        query: async () => {
          // 数据由父组件管理，触发刷新事件后返回当前数据
          emit('refresh');
          // 返回当前数据，避免覆盖
          return {
            list: Array.isArray(props.list) ? props.list : [],
            total: props.list?.length || 0,
          };
        },
      },
      enabled: true,
      autoLoad: false,
    },
  } as VxeTableGridOptions<MpMaterialApi.Material>,
});

function updateGridData(data: MpMaterialApi.Material[]) {
  if (gridApi.grid?.loadData) {
    gridApi.grid.loadData(data);
  } else {
    gridApi.setGridOptions({ data });
  }
}

watch(
  () => props.list,
  async (list: MpMaterialApi.Material[]) => {
    const data = Array.isArray(list) ? list : [];
    await nextTick();
    updateGridData(data);
  },
  { immediate: true, flush: 'post' },
);

watch(
  () => props.loading,
  (loading: boolean) => {
    gridApi.setLoading(loading);
  },
  { immediate: true },
);
</script>

<template>
  <Grid class="mt-4">
    <template #toolbar-tools>
      <slot name="toolbar-tools"></slot>
    </template>
    <template #video="{ row }">
      <WxVideoPlayer v-if="row.url" :url="row.url" />
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: '下载',
            type: 'primary',
            link: true,
            icon: ACTION_ICON.DOWNLOAD,
            onClick: () => openWindow(row.url),
          },
          {
            label: $t('common.delete'),
            type: 'danger',
            link: true,
            icon: ACTION_ICON.DELETE,
            auth: ['mp:material:delete'],
            popConfirm: {
              title: '确定要删除该视频吗？',
              confirm: () => emit('delete', row.id!),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
