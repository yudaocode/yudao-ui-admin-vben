<script lang="ts" setup>
import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { formatDate2 } from '@vben/utils';

import { Button, Table } from 'ant-design-vue';

import { WxVoicePlayer } from '#/views/mp/components/wx-voice-play';

const props = defineProps<{
  list: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
}>();

const { hasAccessByCodes } = useAccess();

const columns = [
  {
    align: 'center' as const,
    dataIndex: 'mediaId',
    key: 'mediaId',
    title: '编号',
  },
  { align: 'center' as const, dataIndex: 'name', key: 'name', title: '文件名' },
  { align: 'center' as const, key: 'voice', title: '语音' },
  {
    align: 'center' as const,
    key: 'createTime',
    title: '上传时间',
    width: 180,
  },
  {
    align: 'center' as const,
    fixed: 'right' as const,
    key: 'action',
    title: '操作',
  },
];

const handleDownload = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <Table
    :columns="columns"
    :data-source="props.list"
    :loading="props.loading"
    :pagination="false"
    bordered
    class="mt-4"
    row-key="id"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'voice'">
        <WxVoicePlayer v-if="record.url" :url="record.url" />
      </template>
      <template v-else-if="column.key === 'createTime'">
        {{ formatDate2(record.createTime) }}
      </template>
      <template v-else-if="column.key === 'action'">
        <Button type="link" @click="handleDownload(record.url)">
          <IconifyIcon icon="mdi:download" />
          下载
        </Button>
        <Button
          v-if="hasAccessByCodes(['mp:material:delete'])"
          danger
          type="link"
          @click="emit('delete', record.id)"
        >
          <IconifyIcon icon="mdi:delete" />
          删除
        </Button>
      </template>
    </template>
  </Table>
</template>
