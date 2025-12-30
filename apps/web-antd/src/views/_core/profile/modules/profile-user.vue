<script setup lang="ts">
import type { SystemUserProfileApi } from '#/api/system/user/profile';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { formatDateTime } from '@vben/utils';

import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons-vue';
import {
  Descriptions,
  DescriptionsItem,
  message,
  Tooltip,
} from 'ant-design-vue';

import { updateUserProfile, verifyEmail } from '#/api/system/user/profile';
import { CropperAvatar } from '#/components/cropper';
import { useUpload } from '#/components/upload/use-upload';

const props = defineProps<{
  profile?: SystemUserProfileApi.UserProfileResp;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const avatar = computed(
  () => props.profile?.avatar || preferences.app.defaultAvatar,
);

const handleVerifyEmail = async () => {
  await verifyEmail();
  message.success($t('common.verifyEmailSendSuccess'));
  emit('success');
};
async function handelUpload({
  file,
  filename,
}: {
  file: Blob;
  filename: string;
}) {
  // 1. 上传头像，获取 URL
  const { httpRequest } = useUpload();
  // 将 Blob 转换为 File
  const fileObj = new File([file], filename, { type: file.type });
  const avatar = await httpRequest(fileObj);
  // 2. 更新用户头像
  await updateUserProfile({ avatar });
}
</script>

<template>
  <div v-if="profile">
    <div class="flex flex-col items-center">
      <Tooltip title="点击上传头像">
        <CropperAvatar
          :show-btn="false"
          :upload-api="handelUpload"
          :value="avatar"
          :width="120"
          @change="emit('success')"
        />
      </Tooltip>
    </div>
    <div class="mt-8">
      <Descriptions :column="{ xxl: 2, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }">
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:user-outlined" class="mr-1" />
              用户账号
            </div>
          </template>
          {{ profile.username }}
        </DescriptionsItem>
        <DescriptionsItem v-if="false">
          <template #label>
            <div class="flex items-center">
              <IconifyIcon
                icon="ant-design:user-switch-outlined"
                class="mr-1"
              />
              所属角色
            </div>
          </template>
          {{ profile.roles.map((role) => role.name).join(',') }}
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
        <DescriptionsItem
          :label-style="{
            display: flex,
            'align-items': center,
            'justify-content': center,
          }"
        >
          <template #label>
            <div class="flex h-full items-center justify-center">
              <IconifyIcon icon="ant-design:mail-outlined" class="mr-1" />
              用户邮箱
            </div>
          </template>
          {{ profile.email }}
          <a-button v-if="profile1?.emailVerified" type="link">
            <CheckCircleOutlined />已验证
          </a-button>
          <a-button v-else type="link" @click="handleVerifyEmail">
            <WarningOutlined />立即验证
          </a-button>
        </DescriptionsItem>
        <DescriptionsItem v-if="false">
          <template #label>
            <div class="flex items-center">
              <IconifyIcon icon="ant-design:team-outlined" class="mr-1" />
              所属部门
            </div>
          </template>
          {{ profile.dept?.name }}
        </DescriptionsItem>
        <DescriptionsItem v-if="false">
          <template #label>
            <div class="flex items-center">
              <IconifyIcon
                icon="ant-design:usergroup-add-outlined"
                class="mr-1"
              />
              所属岗位
            </div>
          </template>
          {{
            profile.posts && profile.posts.length > 0
              ? profile.posts.map((post) => post.name).join(',')
              : '-'
          }}
        </DescriptionsItem>
        <DescriptionsItem>
          <template #label>
            <div class="flex items-center">
              <IconifyIcon
                icon="ant-design:clock-circle-outlined"
                class="mr-1"
              />
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
