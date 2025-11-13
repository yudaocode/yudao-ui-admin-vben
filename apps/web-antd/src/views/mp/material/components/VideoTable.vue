<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { formatDate2 } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { WxVideoPlayer } from '#/views/mp/components/wx-video-play';

// TODO @dylan：vue 组件名小写 + 中划线

const props = defineProps<{
  list: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
}>();

const { hasAccessByCodes } = useAccess();

const columns: VxeTableGridOptions<any>['columns'] = [
  {
    field: 'mediaId',
    title: '编号',
    align: 'center',
    width: 160,
  },
  {
    field: 'name',
    title: '文件名',
    align: 'center',
    minWidth: 200,
  },
  {
    field: 'title',
    title: '标题',
    align: 'center',
    minWidth: 200,
  },
  {
    field: 'introduction',
    title: '介绍',
    align: 'center',
    minWidth: 220,
  },
  {
    field: 'video',
    title: '视频',
    align: 'center',
    width: 220,
    slots: { default: 'video' },
  },
  {
    field: 'createTime',
    title: '上传时间',
    align: 'center',
    width: 180,
    slots: { default: 'createTime' },
  },
  {
    field: 'actions',
    title: '操作',
    align: 'center',
    fixed: 'right',
    width: 180,
    slots: { default: 'actions' },
  },
];

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
    showOverflow: 'tooltip',
  } as VxeTableGridOptions<any>,  // TODO @dylan：这里有个告警哈；
});

function handleDownload(url: string) {
  window.open(url, '_blank');
}

watch(
  () => props.list,
  (list: any[]) => {
    const data = Array.isArray(list) ? list : [];
    if (gridApi.grid?.loadData) {
      gridApi.grid.loadData(data);
    } else {
      gridApi.setGridOptions({ data });
    }
  },
  { immediate: true },
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
    <template #video="{ row }">
      <WxVideoPlayer v-if="row.url" :url="row.url" />
    </template>
    <template #createTime="{ row }">
      {{ formatDate2(row.createTime) }}
    </template>
    <template #actions="{ row }">
      <Button type="link" @click="handleDownload(row.url)">
        <IconifyIcon icon="mdi:download" />
        下载
      </Button>
      <Button
        v-if="hasAccessByCodes(['mp:material:delete'])"
        danger
        type="link"
        @click="emit('delete', row.id)"
      >
        <IconifyIcon icon="mdi:delete" />
        删除
      </Button>
    </template>
  </Grid>
</template>
