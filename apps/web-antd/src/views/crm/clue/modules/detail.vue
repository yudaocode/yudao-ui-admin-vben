<script setup lang="ts">
import type { CrmClueApi } from '#/api/crm/clue';

import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { ArrowLeft } from '@vben/icons';

import { Button, Card, Modal, Tabs } from 'ant-design-vue';

import { getClue, transformClue } from '#/api/crm/clue';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';
import ClueForm from './form.vue';
import TransferForm from './transfer.vue';

const ClueDetailsInfo = defineAsyncComponent(() => import('./detail-info.vue'));

const loading = ref(false);

const route = useRoute();
const router = useRouter();

const clueId = ref(0);

const clue = ref<CrmClueApi.Clue>({} as CrmClueApi.Clue);
const permissionListRef = ref(); // 团队成员列表 Ref

const [Description] = useDescription({
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
async function loadClueDetail() {
  loading.value = true;
  clueId.value = Number(route.params.id);
  const data = await getClue(clueId.value);
  clue.value = data;
  loading.value = false;
}

/** 返回列表页 */
function onBack() {
  router.push('/crm/clue');
}

/** 编辑线索 */
function onEdit() {
  formModalApi.setData({ id: clueId }).open();
}

/** 转移线索 */
function onTransfer() {
  transferModalApi.setData({ id: clueId }).open();
}

/** 转化为客户 */
async function onTransform() {
  try {
    await Modal.confirm({
      title: '提示',
      content: '确定将该线索转化为客户吗？',
    });
    await transformClue(clueId.value);
    Modal.success({
      title: '成功',
      content: '转化客户成功',
    });
    await loadClueDetail();
  } catch {
    // 用户取消操作
  }
}

// 加载数据
onMounted(async () => {
  await loadClueDetail();
});
</script>

<template>
  <Page auto-content-height :title="clue?.name" :loading="loading">
    <template #extra>
      <div class="flex items-center gap-2">
        <Button @click="onBack">
          <ArrowLeft class="size-5" />
          返回
        </Button>
        <Button
          v-if="permissionListRef?.validateWrite"
          type="primary"
          @click="onEdit"
          v-access:code="['crm:clue:update']"
        >
          {{ $t('ui.actionTitle.edit') }}
        </Button>
        <Button
          v-if="permissionListRef?.validateOwnerUser"
          type="primary"
          @click="onTransfer"
          v-access:code="['crm:clue:update']"
        >
          转移
        </Button>
        <Button
          v-if="permissionListRef?.validateOwnerUser && !clue?.transformStatus"
          type="primary"
          @click="onTransform"
          v-access:code="['crm:clue:update']"
        >
          转化为客户
        </Button>
      </div>
    </template>
    <Card>
      <Description :data="clue" />
    </Card>
    <Card class="mt-4">
      <Tabs>
        <Tabs.TabPane tab="线索跟进" key="1">
          <div>线索跟进</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="基本信息" key="2">
          <ClueDetailsInfo :clue="clue" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="3">
          <div>团队成员</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="4">
          <div>操作日志</div>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <FormModal @success="loadClueDetail" />
    <TransferModal @success="loadClueDetail" />
  </Page>
</template>
