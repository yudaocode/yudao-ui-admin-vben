<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Card, TabPanel, Tabs } from 'tdesign-vue-next';

import { getAuthPermissionInfoApi } from '#/api';
import { getUserProfile } from '#/api/system/user/profile';

import BaseInfo from './modules/base-info.vue';
import ProfileUser from './modules/profile-user.vue';
import ResetPwd from './modules/reset-pwd.vue';
import UserSocial from './modules/user-social.vue';

const userStore = useUserStore();
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
  const authPermissionInfo = await getAuthPermissionInfoApi();
  userStore.setUserInfo(authPermissionInfo.user);
}

/** 初始化 */
onMounted(loadProfile);
</script>

<template>
  <Page auto-content-height>
    <div class="flex">
      <!-- 左侧 个人信息 -->
      <Card class="w-2/5" title="个人信息">
        <ProfileUser :profile="profile" @success="refreshProfile" />
      </Card>

      <!-- 右侧 标签页 -->
      <Card class="ml-3 w-3/5">
        <Tabs v-model="activeName" class="-mt-4">
          <TabPanel value="basicInfo" label="基本设置">
            <BaseInfo :profile="profile" @success="refreshProfile" />
          </TabPanel>
          <TabPanel value="resetPwd" label="密码设置">
            <ResetPwd />
          </TabPanel>
          <TabPanel
            value="userSocial"
            label="社交绑定"
            :destroy-on-hide="false"
          >
            <UserSocial @update:active-name="activeName = $event" />
          </TabPanel>
          <!-- TODO @芋艿：在线设备 -->
        </Tabs>
      </Card>
    </div>
  </Page>
</template>
