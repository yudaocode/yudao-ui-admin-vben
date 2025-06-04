<script setup lang="ts">
import type { CrmCustomerApi } from '#/api/crm/customer';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Modal, Tabs } from 'ant-design-vue';

import { getCustomer, updateCustomerDealStatus } from '#/api/crm/customer';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';
import { OperateLog } from '#/components/operate-log';

import { useDetailSchema } from '../data';

const CustomerDetailsInfo = defineAsyncComponent(
  () => import('./detail-info.vue'),
);

const loading = ref(false);

const route = useRoute();
const router = useRouter();

const customerId = ref(0);

const customer = ref<CrmCustomerApi.Customer>({} as CrmCustomerApi.Customer);
const permissionListRef = ref(); // 团队成员列表 Ref

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    column: 4,
    class: 'mx-4',
  },
  schema: useDetailSchema(),
});

/** 加载详情 */
async function loadCustomerDetail() {
  loading.value = true;
  customerId.value = Number(route.params.id);
  const data = await getCustomer(customerId.value);
  await getOperateLog();
  customer.value = data;
  loading.value = false;
}

/** 编辑 */
function handleEdit() {
  // formModalApi.setData({ id: clueId }).open();
}

/** 转移线索 */
function handleTransfer() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 锁定客户 */
function handleLock() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 解锁客户 */
function handleUnlock() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 领取客户 */
function handleReceive() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 分配客户 */
function handleDistributeForm() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 客户放入公海 */
function handlePutPool() {
  // transferModalApi.setData({ id: clueId }).open();
}

/** 更新成交状态操作 */
async function handleUpdateDealStatus() {
  const dealStatus = !customer.value.dealStatus;
  try {
    await Modal.confirm({
      title: '提示',
      content: `确定更新成交状态为【${dealStatus ? '已成交' : '未成交'}】吗？`,
    });
    await updateCustomerDealStatus(customerId.value, dealStatus);
    Modal.success({
      title: '成功',
      content: '更新成交状态成功',
    });
    await loadCustomerDetail();
  } catch {
    // 用户取消操作
  }
}

/** 获取操作日志 */
const logList = ref<SystemOperateLogApi.OperateLog[]>([]); // 操作日志列表
async function getOperateLog() {
  if (!customerId.value) {
    return;
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CUSTOMER,
    bizId: customerId.value,
  });
  logList.value = data.list;
}

// 加载数据
onMounted(async () => {
  await loadCustomerDetail();
});
</script>

<template>
  <Page auto-content-height :title="customer?.name" :loading="loading">
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
    <Card>
      <Description :data="customer" />
    </Card>
    <Card class="mt-4">
      <Tabs>
        <Tabs.TabPane tab="跟进记录" key="1">
          <div>跟进记录</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="基本信息" key="2">
          <CustomerDetailsInfo />
        </Tabs.TabPane>
        <Tabs.TabPane tab="联系人" key="3">
          <div>联系人</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="4">
          <div>团队成员</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="商机" key="5">
          <div>商机</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="合同" key="6">
          <div>合同</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="回款" key="7">
          <div>回款</div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="8">
          <OperateLog :log-list="logList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
