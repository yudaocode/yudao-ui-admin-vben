<script setup lang="ts">
import type { CrmCustomerApi } from '#/api/crm/customer';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Card, message, Tabs } from 'ant-design-vue';

import { getCustomer, updateCustomerDealStatus } from '#/api/crm/customer';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const CustomerDetailsInfo = defineAsyncComponent(
  () => import('./detail-info.vue'),
);

const FollowUp = defineAsyncComponent(
  () => import('#/views/crm/followup/index.vue'),
);

const PermissionList = defineAsyncComponent(
  () => import('#/views/crm/permission/modules/permission-list.vue'),
);

const TransferForm = defineAsyncComponent(
  () => import('#/views/crm/permission/modules/transfer-form.vue'),
);

const OperateLog = defineAsyncComponent(
  () => import('#/components/operate-log'),
);

const CustomerForm = defineAsyncComponent(
  () => import('#/views/crm/customer/modules/form.vue'),
);

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const customerId = ref(0);

const customer = ref<CrmCustomerApi.Customer>({} as CrmCustomerApi.Customer);
const customerLogList = ref<SystemOperateLogApi.OperateLog[]>([]);
const permissionListRef = ref<InstanceType<typeof PermissionList>>(); // 团队成员列表 Ref

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CustomerForm,
  destroyOnClose: true,
});

const [TransferModal, transferModalApi] = useVbenModal({
  connectedComponent: TransferForm,
  destroyOnClose: true,
});

/** 加载详情 */
async function loadCustomerDetail() {
  loading.value = true;
  customerId.value = Number(route.params.id);
  const data = await getCustomer(customerId.value);
  const logList = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CUSTOMER,
    bizId: customerId.value,
  });
  customerLogList.value = logList.list;
  customer.value = data;
  loading.value = false;
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/customer');
}

/** 编辑 */
function handleEdit() {
  formModalApi.setData({ id: customerId.value }).open();
}

/** 转移线索 */
function handleTransfer() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 锁定客户 */
function handleLock() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 解锁客户 */
function handleUnlock() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 领取客户 */
function handleReceive() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 分配客户 */
function handleDistributeForm() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 客户放入公海 */
function handlePutPool() {
  transferModalApi.setData({ id: customerId.value }).open();
}

/** 更新成交状态操作 */
async function handleUpdateDealStatus(): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    const dealStatus = !customer.value.dealStatus;
    confirm({
      content: `确定更新成交状态为【${dealStatus ? '已成交' : '未成交'}】吗？`,
    })
      .then(async () => {
        const res = await updateCustomerDealStatus(
          customerId.value,
          dealStatus,
        );
        if (res) {
          message.success('更新成交状态成功');
          resolve(true);
        } else {
          reject(new Error('更新成交状态失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

// 加载数据
onMounted(async () => {
  customerId.value = Number(route.params.id);
  await loadCustomerDetail();
});
</script>

<template>
  <Page auto-content-height :title="customer?.name" :loading="loading">
    <FormModal @success="loadCustomerDetail" />
    <TransferModal @success="loadCustomerDetail" />
    <template #extra>
      <div class="flex items-center gap-2">
        <Button
          v-if="permissionListRef?.validateWrite"
          type="primary"
          @click="handleEdit"
          v-access:code="['crm:customer:update']"
        >
          {{ $t('ui.actionTitle.edit') }}
        </Button>
        <Button
          v-if="permissionListRef?.validateOwnerUser"
          type="primary"
          @click="handleTransfer"
        >
          转移
        </Button>
        <Button
          v-if="permissionListRef?.validateWrite"
          @click="handleUpdateDealStatus"
        >
          更改成交状态
        </Button>
        <Button
          v-if="customer.lockStatus && permissionListRef?.validateOwnerUser"
          @click="handleUnlock"
        >
          解锁
        </Button>
        <Button
          v-if="!customer.lockStatus && permissionListRef?.validateOwnerUser"
          @click="handleLock"
        >
          锁定
        </Button>
        <Button v-if="!customer.ownerUserId" @click="handleReceive">
          领取
        </Button>
        <Button v-if="!customer.ownerUserId" @click="handleDistributeForm">
          分配
        </Button>
        <Button
          v-if="customer.ownerUserId && permissionListRef?.validateOwnerUser"
          @click="handlePutPool"
        >
          放入公海
        </Button>
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Description :data="customer" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs>
        <Tabs.TabPane tab="基本信息" key="1" :force-render="true">
          <CustomerDetailsInfo :customer="customer" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="跟进记录" key="2" :force-render="true">
          <FollowUp :biz-id="customerId" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="联系人" key="3" :force-render="true">
          <div>联系人</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="4" :force-render="true">
          <PermissionList
            ref="permissionListRef"
            :biz-id="customerId"
            :biz-type="BizTypeEnum.CRM_CUSTOMER"
            :show-action="true"
            @quit-team="handleBack"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="商机" key="5" :force-render="true">
          <div>商机</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="合同" key="6" :force-render="true">
          <div>合同</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="回款" key="7" :force-render="true">
          <div>回款</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="8" :force-render="true">
          <OperateLog :log-list="customerLogList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
