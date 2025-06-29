<script setup lang="ts">
import type { CrmContractApi } from '#/api/crm/contract';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { ArrowLeft } from '@vben/icons';

import { Button, Card, Tabs } from 'ant-design-vue';

import { getContract } from '#/api/crm/contract';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';
import { AsyncOperateLog } from '#/components/operate-log';
import { ContractDetailsInfo, ContractForm } from '#/views/crm/contract';
import { FollowUp } from '#/views/crm/followup';
import { PermissionList, TransferForm } from '#/views/crm/permission';
import { ProductDetailsList } from '#/views/crm/product';
import {
  ReceivableDetailsList,
  ReceivablePlanDetailsList,
} from '#/views/crm/receivable';

import { useDetailSchema } from './detail-data';

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const contractId = ref(0);

const contract = ref<CrmContractApi.Contract>({} as CrmContractApi.Contract);
const contractLogList = ref<SystemOperateLogApi.OperateLog[]>([]);
const permissionListRef = ref<InstanceType<typeof PermissionList>>(); // 团队成员列表 Ref

// 校验负责人权限和编辑权限
const validateOwnerUser = computed(
  () => permissionListRef.value?.validateOwnerUser,
);
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
  connectedComponent: ContractForm,
  destroyOnClose: true,
});

const [TransferModal, transferModalApi] = useVbenModal({
  connectedComponent: TransferForm,
  destroyOnClose: true,
});

/** 加载合同详情 */
async function loadContractDetail() {
  loading.value = true;
  const data = await getContract(contractId.value);
  contract.value = data;
  // 操作日志
  const logList = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CONTRACT,
    bizId: contractId.value,
  });
  contractLogList.value = logList.list;
  loading.value = false;
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/contract');
}

/** 编辑 */
function handleEdit() {
  formModalApi.setData({ id: contractId.value }).open();
}

/** 转移 */
function handleTransfer() {
  transferModalApi.setData({ bizType: BizTypeEnum.CRM_CONTRACT }).open();
}

// 加载数据
onMounted(() => {
  contractId.value = Number(route.params.id);
  loadContractDetail();
});
</script>

<template>
  <Page auto-content-height :title="contract?.name" :loading="loading">
    <FormModal @success="loadContractDetail" />
    <TransferModal @success="loadContractDetail" />
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
          v-access:code="['crm:contract:update']"
        >
          {{ $t('ui.actionTitle.edit') }}
        </Button>
        <Button v-if="validateOwnerUser" type="primary" @click="handleTransfer">
          转移
        </Button>
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Description :data="contract" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs>
        <Tabs.TabPane tab="详细资料" key="1" :force-render="true">
          <ContractDetailsInfo :contract="contract" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="合同跟进" key="2" :force-render="true">
          <FollowUp :biz-id="contractId" :biz-type="BizTypeEnum.CRM_CONTRACT" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="产品" key="3" :force-render="true">
          <ProductDetailsList
            :biz-id="contractId"
            :biz-type="BizTypeEnum.CRM_CONTRACT"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="回款" key="4" :force-render="true">
          <ReceivablePlanDetailsList
            :contract-id="contractId"
            :customer-id="contract.customerId"
          />
          <ReceivableDetailsList
            :contract-id="contractId"
            :customer-id="contract.customerId"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="5" :force-render="true">
          <PermissionList
            ref="permissionListRef"
            :biz-id="contractId"
            :biz-type="BizTypeEnum.CRM_CONTRACT"
            :show-action="true"
            @quit-team="handleBack"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="6" :force-render="true">
          <AsyncOperateLog :log-list="contractLogList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
