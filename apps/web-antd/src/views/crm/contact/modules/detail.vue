<script setup lang="ts">
import type { CrmContactApi } from '#/api/crm/contact';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Card, Tabs } from 'ant-design-vue';

import { getContact } from '#/api/crm/contact';
import { getOperateLogPage } from '#/api/crm/operateLog';
import { BizTypeEnum } from '#/api/crm/permission';
import { useDescription } from '#/components/description';
import { AsyncOperateLog } from '#/components/operate-log';
import { BusinessDetailsList } from '#/views/crm/business';
import { ContactDetailsInfo, ContactForm } from '#/views/crm/contact';
import { FollowUp } from '#/views/crm/followup';
import { PermissionList, TransferForm } from '#/views/crm/permission';

import { useDetailSchema } from './detail-data';

const loading = ref(false);

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const contactId = ref(0);

const contact = ref<CrmContactApi.Contact>({} as CrmContactApi.Contact);
const contactLogList = ref<SystemOperateLogApi.OperateLog[]>([]);
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
  connectedComponent: ContactForm,
  destroyOnClose: true,
});

const [TransferModal, transferModalApi] = useVbenModal({
  connectedComponent: TransferForm,
  destroyOnClose: true,
});

/** 加载详情 */
async function loadContactDetail() {
  loading.value = true;
  contactId.value = Number(route.params.id);
  const data = await getContact(contactId.value);
  const logList = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CONTACT,
    bizId: contactId.value,
  });
  contactLogList.value = logList.list;
  contact.value = data;
  loading.value = false;
}

/** 返回列表页 */
function handleBack() {
  tabs.closeCurrentTab();
  router.push('/crm/contact');
}

/** 编辑 */
function handleEdit() {
  formModalApi.setData({ id: contactId.value }).open();
}

/** 转移线索 */
function handleTransfer() {
  transferModalApi.setData({ id: contactId.value }).open();
}

// 加载数据
onMounted(() => {
  contactId.value = Number(route.params.id);
  loadContactDetail();
});
</script>

<template>
  <Page auto-content-height :title="contact?.name" :loading="loading">
    <FormModal @success="loadContactDetail" />
    <TransferModal @success="loadContactDetail" />
    <template #extra>
      <div class="flex items-center gap-2">
        <Button
          v-if="permissionListRef?.validateWrite"
          type="primary"
          @click="handleEdit"
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
      </div>
    </template>
    <Card class="min-h-[10%]">
      <Description :data="contact" />
    </Card>
    <Card class="mt-4 min-h-[60%]">
      <Tabs>
        <Tabs.TabPane tab="详细资料" key="1" :force-render="true">
          <ContactDetailsInfo :contact="contact" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="跟进记录" key="2" :force-render="true">
          <FollowUp :biz-id="contactId" :biz-type="BizTypeEnum.CRM_CONTACT" />
        </Tabs.TabPane>
        <Tabs.TabPane tab="团队成员" key="3" :force-render="true">
          <PermissionList
            ref="permissionListRef"
            :biz-id="contactId"
            :biz-type="BizTypeEnum.CRM_CONTACT"
            :show-action="true"
            @quit-team="handleBack"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="商机" key="4" :force-render="true">
          <BusinessDetailsList
            :biz-id="contactId"
            :biz-type="BizTypeEnum.CRM_CONTACT"
            :contact-id="contactId"
            :customer-id="contact.customerId"
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="操作日志" key="5" :force-render="true">
          <AsyncOperateLog :log-list="contactLogList" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
