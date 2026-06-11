<script setup lang="ts">
import type { CrmClueApi } from '#/api/crm/clue';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Card, message, Tabs } from 'antdv-next';

import { getClue, transformClue } from '#/api/crm/clue';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';
import { OperateLog } from '#/components/operate-log';
import { ACTION_ICON, TableAction } from '#/components/table-action';
import { FollowUp } from '#/views/crm/followup';
import { PermissionList, TransferForm } from '#/views/crm/permission';

import Form from '../modules/form.vue';
import { useDetailSchema } from './data';
import Info from './modules/info.vue';

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const loading = ref(false); // 加载中
const clueId = ref(0); // 线索编号
const clue = ref<CrmClueApi.Clue>({} as CrmClueApi.Clue); // 线索详情
const logList = ref<SystemOperateLogApi.OperateLog[]>([]); // 操作日志
const permissionListRef = ref<InstanceType<typeof PermissionList>>(); // 团队成员列表 Ref
const clueTabItems = [
  { key: '1', label: '跟进记录', forceRender: true },
  { key: '2', label: '基本信息', forceRender: true },
  { key: '3', label: '团队成员', forceRender: true },
  { key: '4', label: '操作日志', forceRender: true },
];

const [Descriptions] = useDescription({
  bordered: false,
  column: 4,
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
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
  router.push({ name: 'CrmClue' });
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
  try {
    await confirm('确定将该线索转化为客户吗？');
  } catch {
    return false;
  }
  // 转化为客户
  await transformClue(clueId.value);
  // 提示并返回成功
  message.success('转化客户成功');
  return true;
}

/** 加载数据 */
onMounted(() => {
  clueId.value = Number(route.params.id);
  getClueDetail();
});
</script>

<template>
  <Page auto-content-height :title="clue?.name" :loading="loading">
    <FormModal @success="getClueDetail" />
    <TransferModal @success="getClueDetail" />
    <template #extra>
      <TableAction
        :actions="[
          {
            label: '返回',
            type: 'default',
            icon: 'lucide:arrow-left',
            onClick: handleBack,
          },
          {
            label: $t('ui.actionTitle.edit'),
            type: 'primary',
            icon: ACTION_ICON.EDIT,
            auth: ['crm:clue:update'],
            ifShow: permissionListRef?.validateWrite,
            onClick: handleEdit,
          },
          {
            label: '转移',
            type: 'primary',
            ifShow: permissionListRef?.validateOwnerUser,
            onClick: handleTransfer,
          },
          {
            label: '转化为客户',
            type: 'primary',
            ifShow:
              permissionListRef?.validateOwnerUser && !clue?.transformStatus,
            onClick: handleTransform,
          },
        ]"
      />
    </template>
    <Card class="min-h-[10%]">
      <Descriptions :data="clue" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs :items="clueTabItems" :tab-bar-gutter="16">
        <template #contentRender="{ item }">
          <FollowUp
            v-if="item.key === '1'"
            :biz-id="clueId"
            :biz-type="BizTypeEnum.CRM_CLUE"
          />
          <Info v-else-if="item.key === '2'" :clue="clue" />
          <PermissionList
            v-else-if="item.key === '3'"
            ref="permissionListRef"
            :biz-id="clueId"
            :biz-type="BizTypeEnum.CRM_CLUE"
            :show-action="true"
            @quit-team="handleBack"
          />
          <OperateLog v-else-if="item.key === '4'" :log-list="logList" />
        </template>
      </Tabs>
    </Card>
  </Page>
</template>
