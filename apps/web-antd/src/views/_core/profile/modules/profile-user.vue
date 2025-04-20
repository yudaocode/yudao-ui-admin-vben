<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { Descriptions, DescriptionsItem, Tooltip } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

import { computed } from 'vue';
import { preferences } from '@vben/preferences';
import { updateUserAvatar } from '#/api/system/user/profile';
import { formatDateTime } from '@vben/utils';
// import { CropperAvatar } from '#/components/cropper';

const props = defineProps<{ profile?: SystemUserProfileApi.UserProfileRespVO }>();

defineEmits<{
  // 头像上传完毕
  success: [];
}>();

const avatar = computed(
  () => props.profile?.avatar || preferences.app.defaultAvatar,
);
</script>

<template>
  <div v-if="profile">
    <div class="flex flex-col items-center gap-[20px]">
      <Tooltip title="点击上传头像">
        <!-- TODO 芋艿：待实现 -->
        <CropperAvatar
          :show-btn="false"
          :upload-api="updateUserAvatar"
          :value="avatar"
          width="120"
          @change=""
        />
      </Tooltip>
    </div>
    <div>
      <Descriptions :column="2">
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:user-outlined" class="mr-1" />
              用户账号
            </div>
          </template>
          {{ profile.username }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:user-switch-outlined" class="mr-1" />
              所属角色
            </div>
          </template>
          {{ profile.roles.map(role => role.name).join(',') }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:phone-outlined" class="mr-1" />
              手机号码
            </div>
          </template>
          {{ profile.mobile }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:mail-outlined" class="mr-1" />
              用户邮箱
            </div>
          </template>
          {{ profile.email }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:team-outlined" class="mr-1" />
              所属部门
            </div>
          </template>
          {{ profile.dept?.name }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:usergroup-add-outlined" class="mr-1" />
              所属岗位
            </div>
          </template>
          {{ profile.posts.map(post => post.name).join(',') }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:clock-circle-outlined" class="mr-1" />
              创建时间
            </div>
          </template>
          {{ formatDateTime(profile.createTime) }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:login-outlined" class="mr-1" />
              登录时间
            </div>
          </template>
          {{ formatDateTime(profile.loginDate) }}
        </DescriptionsItem>
      </Descriptions>
    </div>
  </div>
</template>
