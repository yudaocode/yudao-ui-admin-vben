<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { watch } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { formatDate2 } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { WxVoicePlayer } from '#/views/mp/components/wx-voice-play';

// TODO @dylan：vue 组件名小写 + 中划线

// TODO @dylan：组件内，尽量用 modules 哈。只有对外共享，才用 components

const props = defineProps<{
  list: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
}>();

const { hasAccessByCodes } = useAccess();

// TODO @dylan：这里有个告警哈；
// TODO @dylan：放到 data.ts 里；
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
  // TODO @dylan：语音的样式，有点奇怪。
  {
    field: 'voice',
    title: '语音',
    align: 'center',
    width: 220,
    slots: { default: 'voice' },
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
    width: 160,
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
  } as VxeTableGridOptions<any>, // TODO @dylan：这里有个告警哈；
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
    <template #voice="{ row }">
      <WxVoicePlayer v-if="row.url" :url="row.url" />
    </template>
    <!-- TODO @dylan：应该 data.ts 里 formatDate 就好了。别的模块有的哈。 -->
    <template #createTime="{ row }">
      {{ formatDate2(row.createTime) }}
    </template>
    <template #actions="{ row }">
      <!-- TODO @dylan：用 tableaction 哈：yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/user/index.vue -->
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
