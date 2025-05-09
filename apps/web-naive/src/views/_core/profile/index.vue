<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NTabs } from 'naive-ui';

import { getUserProfile } from '#/api/system/user/profile';
import { useAuthStore } from '#/store';

import BaseInfo from './modules/base-info.vue';
import ProfileUser from './modules/profile-user.vue';
import ResetPwd from './modules/reset-pwd.vue';
import UserSocial from './modules/user-social.vue';

const authStore = useAuthStore();
const activeName = ref('basicInfo');

/** 加载个人信息 */
const profile = ref<SystemUserProfileApi.UserProfileRespVO>();
async function loadProfile() {
  profile.value = await getUserProfile();
}

/** 刷新个人信息 */
async function refreshProfile() {
  // 加载个人信息
  await loadProfile();

  // 更新 store
  await authStore.fetchUserInfo();
}

/** 初始化 */
onMounted(loadProfile);
</script>

<template>
  <Page auto-content-height>
    <div class="flex">
      <!-- 左侧 个人信息 -->
      <NCard class="w-2/5" title="个人信息">
        <ProfileUser :profile="profile" @success="refreshProfile" />
      </NCard>

      <!-- 右侧 标签页 -->
      <NCard class="ml-3 w-3/5">
        <NTabs v-model:active-key="activeName" class="-mt-4">
          <NTabs.TabPane key="basicInfo" tab="基本设置">
            <BaseInfo :profile="profile" @success="refreshProfile" />
          </NTabs.TabPane>
          <NTabs.TabPane key="resetPwd" tab="密码设置">
            <ResetPwd />
          </NTabs.TabPane>
          <NTabs.TabPane key="userSocial" tab="社交绑定" force-render>
            <UserSocial @update:active-name="activeName = $event" />
          </NTabs.TabPane>
          <!-- TODO @芋艿：在线设备 -->
        </NTabs>
      </NCard>
    </div>
  </Page>
</template>
