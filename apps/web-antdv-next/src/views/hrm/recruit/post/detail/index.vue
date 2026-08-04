<script lang="ts" setup>
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Card, message, TabPane, Tabs } from 'antdv-next';

import { getOperateLogPage } from '#/api/hrm/operate-log';
import { getRecruitPost } from '#/api/hrm/recruit/post';
import { OperateLog } from '#/components/operate-log';
import { ACTION_ICON, TableAction } from '#/components/table-action';
import { HrmBizType } from '#/views/hrm/utils/constants';

import Form from '../modules/form.vue';
import Header from './modules/header.vue';
import Info from './modules/info.vue';

defineOptions({ name: 'HrmRecruitPostDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const postId = Number(route.params.id);
const loading = ref(true);
const activeTab = ref('detail');
const post = ref<HrmRecruitPostApi.RecruitPost>(
  {} as HrmRecruitPostApi.RecruitPost,
);
const logList = ref<SystemOperateLogApi.OperateLog[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 关闭详情 */
function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmRecruitPost' });
}

/** 获取操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.RECRUIT_POST,
    bizId: postId,
  });
  logList.value = data.list;
}

/** 获取详情 */
async function getPost() {
  loading.value = true;
  try {
    const data = await getRecruitPost(postId);
    if (!data) {
      message.warning('招聘职位不存在');
      close();
      return;
    }
    post.value = data;
    await getOperateLog();
  } finally {
    loading.value = false;
  }
}

/** 编辑 */
function openForm() {
  formModalApi.setData({ id: postId }).open();
}

onMounted(() => {
  if (!Number.isSafeInteger(postId) || postId <= 0) {
    message.warning('参数错误，招聘职位不能为空！');
    close();
    return;
  }
  getPost();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="getPost" />
    <Header :loading="loading" :post="post">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'primary',
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:recruit:post:update'],
            disabled: !post.id,
            onClick: openForm,
          },
        ]"
      />
    </Header>
    <Card class="mt-4">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="detail" tab="详细资料">
          <Info :post="post" />
        </TabPane>
        <TabPane key="log" tab="操作日志">
          <OperateLog :log-list="logList" />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
