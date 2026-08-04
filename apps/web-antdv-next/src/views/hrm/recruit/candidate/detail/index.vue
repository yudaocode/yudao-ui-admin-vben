<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';
import type { HrmRecruitInterviewApi } from '#/api/hrm/recruit/interview';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Card, message, TabPane, Tabs } from 'antdv-next';

import { getOperateLogPage } from '#/api/hrm/operate-log';
import { getRecruitCandidate } from '#/api/hrm/recruit/candidate';
import { getRecruitInterviewListByCandidate } from '#/api/hrm/recruit/interview';
import { OperateLog } from '#/components/operate-log';
import { ACTION_ICON, TableAction } from '#/components/table-action';
import { HrmBizType } from '#/views/hrm/utils/constants';

import Form from '../modules/form.vue';
import Header from './modules/header.vue';
import Info from './modules/info.vue';
import InterviewList from './modules/interview-list.vue';
import MaterialFiles from './modules/material-files.vue';

defineOptions({ name: 'HrmRecruitCandidateDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const candidateId = Number(route.params.id);
const loading = ref(true);
const activeTab = ref('detail');
const candidate = ref<HrmRecruitCandidateApi.RecruitCandidate>(
  {} as HrmRecruitCandidateApi.RecruitCandidate,
);
const interviewList = ref<HrmRecruitInterviewApi.RecruitInterview[]>([]);
const logList = ref<SystemOperateLogApi.OperateLog[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 关闭详情 */
function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmRecruitCandidate' });
}

/** 获取面试记录 */
async function getInterviewList() {
  interviewList.value = await getRecruitInterviewListByCandidate(candidateId);
}

/** 获取操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.RECRUIT_CANDIDATE,
    bizId: candidateId,
  });
  logList.value = data.list;
}

/** 获取详情 */
async function getCandidate() {
  loading.value = true;
  try {
    const data = await getRecruitCandidate(candidateId);
    if (!data) {
      message.warning('招聘候选人不存在');
      close();
      return;
    }
    candidate.value = data;
    await Promise.all([getInterviewList(), getOperateLog()]);
  } finally {
    loading.value = false;
  }
}

/** 编辑 */
function openForm() {
  formModalApi.setData({ id: candidateId }).open();
}

/** 初始化 */
onMounted(() => {
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0) {
    message.warning('参数错误，招聘候选人不能为空！');
    close();
    return;
  }
  getCandidate();
});
</script>

<template>
  <Page auto-content-height :loading="loading">
    <FormModal @success="getCandidate" />
    <Header :candidate="candidate" :loading="loading">
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'primary',
            icon: ACTION_ICON.EDIT,
            auth: ['hrm:recruit:candidate:update'],
            disabled: !candidate.id,
            onClick: openForm,
          },
        ]"
      />
    </Header>
    <Card class="mt-4">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="detail" tab="详细资料">
          <Info :candidate="candidate" />
        </TabPane>
        <TabPane key="file" tab="材料附件" :force-render="false">
          <MaterialFiles :candidate="candidate" />
        </TabPane>
        <TabPane key="interview" tab="面试记录" :force-render="false">
          <InterviewList :interview-list="interviewList" />
        </TabPane>
        <TabPane key="operateLog" tab="操作日志">
          <OperateLog :log-list="logList" />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
