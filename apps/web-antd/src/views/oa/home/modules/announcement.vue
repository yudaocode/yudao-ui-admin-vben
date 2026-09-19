<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { OaAnnouncementApi } from '#/api/oa/announcement';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Button, Table, Tag } from 'ant-design-vue';

import { getReceivedAnnouncementPage } from '#/api/oa/announcement';
import { DictTag } from '#/components/dict-tag';
import OaAnnouncementDetail from '#/views/oa/announcement/list/modules/detail.vue';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomeAnnouncement' });

const { push } = useRouter(); // 路由跳转
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const list = ref<OaAnnouncementApi.Announcement[]>([]); // 公告列表

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: OaAnnouncementDetail,
  destroyOnClose: true,
});

const columns: TableColumnsType = [
  {
    key: 'publisherDeptName',
    title: '发布部门',
    dataIndex: 'publisherDeptName',
    ellipsis: true,
  },
  { key: 'priority', title: '优先级', align: 'center', width: 90 },
  { key: 'title', title: '标题', dataIndex: 'title', ellipsis: true },
  { key: 'readStatus', title: '状态', align: 'center', width: 90 },
  { key: 'createTime', title: '发布时间', align: 'center', width: 170 },
];

/** 查看公告详情，并同步阅读状态 */
function handleDetail(id: number) {
  detailModalApi.setData({ id, markAsRead: true }).open();
}

/** 详情读取成功后同步当前列表的阅读状态 */
function handleRead(id: number) {
  const announcement = list.value.find((item) => item.id === id);
  if (announcement) {
    announcement.readStatus = true;
  }
}

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    list.value = (
      await getReceivedAnnouncementPage({ pageNo: 1, pageSize: 5 })
    ).list;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <OaHomePanel title="公告通知">
    <template #actions>
      <Button type="link" @click="push('/oa/announcement/my')">更多</Button>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <Button type="link" @click="getList">重新加载</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'priority'">
          <DictTag :type="DICT_TYPE.OA_PRIORITY" :value="record.priority" />
        </template>
        <template v-else-if="column.key === 'title'">
          <Button type="link" @click="handleDetail(record.id)">
            {{ record.title }}
          </Button>
        </template>
        <template v-else-if="column.key === 'readStatus'">
          <Tag :color="record.readStatus ? 'default' : 'error'">
            {{ record.readStatus ? '已读' : '未读' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDateTime(record.createTime) }}
        </template>
      </template>
    </Table>
    <DetailModal @read="handleRead" />
  </OaHomePanel>
</template>
