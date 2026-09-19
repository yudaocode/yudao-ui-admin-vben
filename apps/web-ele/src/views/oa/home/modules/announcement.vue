<script lang="ts" setup>
import type { OaAnnouncementApi } from '#/api/oa/announcement';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { getReceivedAnnouncementPage } from '#/api/oa/announcement';
import { DictTag } from '#/components/dict-tag';
import OaAnnouncementDetail from '#/views/oa/announcement/list/modules/detail.vue';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomeAnnouncement' });

const { push } = useRouter();
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const list = ref<OaAnnouncementApi.Announcement[]>([]); // 公告列表

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: OaAnnouncementDetail,
  destroyOnClose: true,
});

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
  <OaHomePanel v-loading="loading" title="公告通知">
    <template #actions>
      <ElButton link type="primary" @click="push('/oa/announcement/my')">
        更多
      </ElButton>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <ElButton link type="primary" @click="getList">重新加载</ElButton>
    </div>
    <ElTable :data="list" :show-header="true" :show-overflow-tooltip="true">
      <ElTableColumn label="发布部门" min-width="130" prop="publisherDeptName" />
      <ElTableColumn align="center" label="优先级" width="90">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_PRIORITY" :value="row.priority" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="标题" min-width="240">
        <template #default="{ row }">
          <ElButton link type="primary" @click="handleDetail(row.id)">
            {{ row.title }}
          </ElButton>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="状态" width="90">
        <template #default="{ row }">
          <ElTag :type="row.readStatus ? 'info' : 'danger'">
            {{ row.readStatus ? '已读' : '未读' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="发布时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </ElTableColumn>
    </ElTable>
    <DetailModal @read="handleRead" />
  </OaHomePanel>
</template>
