<script lang="ts" setup>
import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { formatDate2 } from '@vben/utils';

import WxVideoPlayer from '#/views/mp/components/wx-video-play';

const props = defineProps<{
  list: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
}>();

const { hasAccessByCodes } = useAccess();

const columns = [
  { align: 'center', dataIndex: 'mediaId', key: 'mediaId', title: '编号' },
  { align: 'center', dataIndex: 'name', key: 'name', title: '文件名' },
  { align: 'center', dataIndex: 'title', key: 'title', title: '标题' },
  {
    align: 'center',
    dataIndex: 'introduction',
    key: 'introduction',
    title: '介绍',
  },
  { align: 'center', key: 'video', title: '视频' },
  { align: 'center', key: 'createTime', title: '上传时间', width: 180 },
  { align: 'center', fixed: 'right', key: 'action', title: '操作' },
];

// 下载文件
const handleDownload = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="props.list"
    :loading="props.loading"
    :pagination="false"
    bordered
    class="mt-4"
    row-key="id"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'video'">
        <WxVideoPlayer v-if="record.url" :url="record.url" />
      </template>
      <template v-else-if="column.key === 'createTime'">
        {{ formatDate2(record.createTime) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <a-button type="link" @click="handleDownload(record.url)">
          <IconifyIcon icon="mdi:download" />
          下载
        </a-button>
        <a-button
          v-if="hasAccessByCodes(['mp:material:delete'])"
          danger
          type="link"
          @click="emit('delete', record.id)"
        >
          <IconifyIcon icon="mdi:delete" />
          删除
        </a-button>
      </template>
    </template>
  </a-table>
</template>
