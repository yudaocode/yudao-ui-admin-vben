<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';
import type { VitalSignsApi } from '#/api/member/vitalsigns';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message } from 'ant-design-vue';

import { getUser } from '#/api/member/user';
import { getVitalsignsByUserId } from '#/api/member/vitalsigns';
import { $t } from '#/locales';

import UserBasicInfo from '../components/user-basic-info.vue';
import UserVitalSigns from '../components/user-vital-signs.vue';
import Form from './form.vue';

const route = useRoute();
const { closeCurrentTab, refreshTab } = useTabs();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const userId = Number(route.query.id);
const user = ref<MemberUserApi.User>();
const vitalSigns = ref<VitalSignsApi.VitalSigns>();
/* 钱包初始化数据 */

async function getUserDetail() {
  if (!userId) {
    message.error('参数错误，会员编号不能为空！');
    closeCurrentTab();
    return;
  }
  user.value = await getUser(userId);
  vitalSigns.value = await getVitalsignsByUserId(userId);
}

function handleEdit() {
  formModalApi.setData(user.value).open();
}

onMounted(async () => {
  await getUserDetail();
});
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshTab" />
    <div class="flex">
      <UserBasicInfo v-if="user" class="w-3/5" :user="user" mode="member">
        <template #title> 基本信息 </template>
        <template #extra>
          <Button type="primary" @click="handleEdit">
            {{ $t('common.edit') }}
          </Button>
        </template>
      </UserBasicInfo>
      <UserVitalSigns class="ml-4 w-2/5" :vital-signs="vitalSigns">
        <template #title> 生命体征 </template>
      </UserVitalSigns>
    </div>
  </Page>
</template>
