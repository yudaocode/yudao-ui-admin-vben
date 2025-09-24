<script setup lang="ts">
import type { CrmClueApi } from '#/api/crm/clue';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, message, Tabs } from 'ant-design-vue';

import { getClue, transformClue } from '#/api/crm/clue';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';
// TODO @芋艿：要不要 AsyncOperateLog 风格？
import { AsyncOperateLog } from '#/components/operate-log';
import { FollowUp } from '#/views/crm/followup';
import { PermissionList, TransferForm } from '#/views/crm/permission';

import ClueForm from '../modules/form.vue';
import { useDetailSchema } from './data';

const ClueInfo = defineAsyncComponent(() => import('./modules/info.vue'));

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const clueId = ref(0); // 线索编号
const clue = ref<CrmClueApi.Clue>({} as CrmClueApi.Clue); // 线索详情
const logList = ref<SystemOperateLogApi.OperateLog[]>([]); // 操作日志
const permissionListRef = ref<InstanceType<typeof PermissionList>>(); // 团队成员列表 Ref

/** 校验负责人权限和编辑权限 */
const validateOwnerUser = computed(
  () => permissionListRef.value?.validateOwnerUser,
);
const validateWrite = computed(() => permissionListRef.value?.validateWrite);

const [Descriptions] = useDescription({
  componentProps: {
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ClueForm,
  destroyOnClose: true,
});

const [TransferModal, transferModalApi] = useVbenModal({
  connectedComponent: TransferForm,
  destroyOnClose: true,
});

/** 加载线索详情 */
async function getClueDetail() {
  loading.value = true;
  try {
    clue.value = await getClue(clueId.value);
    // 操作日志
    const res = await getOperateLogPage({
      bizType: BizTypeEnum.CRM_CLUE,
      bizId: clueId.value,
    });
    logList.value = res.list;
  } finally {
    loading.value = false;
  }
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/clue');
}

/** 编辑线索 */
function handleEdit() {
  formModalApi.setData({ id: clueId.value }).open();
}

/** 转移线索 */
function handleTransfer() {
  transferModalApi.setData({ bizType: BizTypeEnum.CRM_CLUE }).open();
}

/** 转化为客户 */
async function handleTransform(): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    confirm({
      content: '确定将该线索转化为客户吗？',
    })
      .then(async () => {
        const res = await transformClue(clueId.value);
        if (res) {
          message.success('转化客户成功');
          resolve(true);
        } else {
          reject(new Error('转化失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

/** 加载数据 */
onMounted(() => {
  clueId.value = route.params.id as number;
  getClueDetail();
});
</script>

<template>
  <Page auto-content-height :title="clue?.name" :loading="loading">
    <FormModal @success="getClueDetail" />
    <TransferModal @success="getClueDetail" />
    <template #extra>
      <div class="flex items-center gap-2">
        <Button @click="handleBack">
          <IconifyIcon icon="lucide:arrow-left" />
          返回
        </Button>
        <Button
          v-if="validateWrite"
          type="primary"
          @click="handleEdit"
          v-access:code="['crm:clue:update']"
        >
          {{ $t('ui.actionTitle.edit') }}
        </Button>
        <Button v-if="validateOwnerUser" type="primary" @click="handleTransfer">
          转移
        </Button>
        <Button
          v-if="validateOwnerUser && !clue?.transformStatus"
          type="primary"
          @click="handleTransform"
        >
          转化为客户
        </Button>
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Descriptions :data="clue" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs class="tabs-tight" :tab-bar-gutter="16">
        <Tabs.TabPane tab="跟进记录" key="1" :force-render="true">
          <FollowUp :biz-id="clueId" :biz-type="BizTypeEnum.CRM_CLUE" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="基本信息" key="2" :force-render="true">
          <ClueInfo :clue="clue" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="3" :force-render="true">
          <PermissionList
            ref="permissionListRef"
            :biz-id="clueId"
            :biz-type="BizTypeEnum.CRM_CLUE"
            :show-action="true"
            @quit-team="handleBack"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="4" :force-render="true">
          <AsyncOperateLog :log-list="logList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
