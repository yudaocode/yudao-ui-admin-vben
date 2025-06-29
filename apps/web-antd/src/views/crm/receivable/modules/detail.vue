<script setup lang="ts">
import type { CrmReceivableApi } from '#/api/crm/receivable';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { ArrowLeft } from '@vben/icons';

import { Button, Card, Tabs } from 'ant-design-vue';

import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { getReceivable } from '#/api/crm/receivable';
import { useDescription } from '#/components/description';
import { AsyncOperateLog } from '#/components/operate-log';
import { PermissionList } from '#/views/crm/permission';
import { ReceivableDetailsInfo } from '#/views/crm/receivable';

import { useDetailSchema } from './detail-data';
import ReceivableForm from './form.vue';

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const receivableId = ref(0);

const receivable = ref<CrmReceivableApi.Receivable>(
  {} as CrmReceivableApi.Receivable,
);
const receivableLogList = ref<SystemOperateLogApi.OperateLog[]>([]);
const permissionListRef = ref<InstanceType<typeof PermissionList>>(); // 团队成员列表 Ref

// 校验编辑权限
const validateWrite = computed(() => permissionListRef.value?.validateWrite);

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ReceivableForm,
  destroyOnClose: true,
});

/** 加载回款详情 */
async function loadReceivableDetail() {
  loading.value = true;
  const data = await getReceivable(receivableId.value);
  receivable.value = data;
  // 操作日志
  const logList = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_RECEIVABLE,
    bizId: receivableId.value,
  });
  receivableLogList.value = logList.list;
  loading.value = false;
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/receivable');
}

/** 编辑收款 */
function handleEdit() {
  formModalApi.setData({ id: receivableId.value }).open();
}

// 加载数据
onMounted(() => {
  receivableId.value = Number(route.params.id);
  loadReceivableDetail();
});
</script>

<template>
  <Page auto-content-height :title="receivable?.no" :loading="loading">
    <FormModal @success="loadReceivableDetail" />
    <template #extra>
      <div class="flex items-center gap-2">
        <Button @click="handleBack">
          <ArrowLeft class="size-5" />
          返回
        </Button>
        <Button
          v-if="validateWrite"
          type="primary"
          @click="handleEdit"
          v-access:code="['crm:receivable:update']"
        >
          {{ $t('ui.actionTitle.edit') }}
        </Button>
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Description :data="receivable" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs>
        <Tabs.TabPane tab="详细资料" key="1" :force-render="true">
          <ReceivableDetailsInfo :receivable="receivable" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="2" :force-render="true">
          <PermissionList
            ref="permissionListRef"
            :biz-id="receivableId"
            :biz-type="BizTypeEnum.CRM_RECEIVABLE"
            :show-action="true"
            @quit-team="handleBack"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="3" :force-render="true">
          <AsyncOperateLog :log-list="receivableLogList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
