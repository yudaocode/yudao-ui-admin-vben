<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VbenAvatar,
} from '@vben-core/shadcn-ui';

import {
  CheckOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  MailOutlined,
  SettingFilled,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { getServiceArea } from '#/api/mpr/serviceArea';
import { getUserProfile, verifyEmail } from '#/api/system/user/profile';

import FormModalServiceArea from './form-modal-service-area.vue';

// 路由

defineOptions({
  name: 'WorkbenchUserInfo',
});
defineEmits(['click']);
const router = useRouter();
const user = ref({} as ProfileVO);
const getUserInfo = async () => {
  const data = await getUserProfile();
  user.value = data;
  await getServiceAreaHandle();
};

const handleVerifyEmail = async () => {
  await verifyEmail();
  message.success($t('common.verifyEmailSendSuccess'));
  emit('success');
};

const serviceArea = ref({});
const getServiceAreaHandle = async () => {
  if (!user.value.serviceAreaId) return;
  serviceArea.value = await getServiceArea(user.value.serviceAreaId);
};
onMounted(async () => {
  await getUserInfo();
  if (!user.value.serviceAreaId) {
    openFormModal();
  }
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: FormModalServiceArea,
});

function openFormModal() {
  formModalApi
    .setData({
      // 表单值
      serviceAreaId: user.value.serviceAreaId,
    })
    .open();
}
</script>

<template>
  <Card>
    <FormModal />
    <CardHeader class="py-4">
      <CardTitle class="flex w-full text-lg">
        <VbenAvatar dot class="mr-5 size-7" :src="user?.avatar || ''" />
        {{ user.nickname }}
        <div class="float-right">
          <a-button
            type="primary"
            shape="circle"
            @click="router.push('/profile')"
          >
            <SettingFilled />
          </a-button>
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex flex-wrap border-t p-5">
      <a-typography>
        <a-typography-title :level="5">服务区域</a-typography-title>
        <a-typography-paragraph>
          <div class="mt-25px">
            <div class="flex items-center">
              <EnvironmentOutlined
                :style="{ fontSize: '18px', color: '#08c' }"
              />
              <div class="mx-2">
                <div class="text-14px">
                  <span style="font-weight: bold">
                    {{
                      serviceArea.state
                        ? `${serviceArea?.state} ${serviceArea?.city}`
                        : '未设置'
                    }}
                  </span>
                  <span class="ml-25px ml-5" :underline="false">
                    <a-button
                      v-if="user?.serviceAreaId"
                      type="success"
                      link
                      @click="openFormModal"
                    >
                      <CheckOutlined />已设置
                    </a-button>
                    <a-button v-else type="primary" link @click="openFormModal">
                      <InfoCircleOutlined />立即设置
                    </a-button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a-typography-paragraph>
        <a-typography-title :level="5">邮箱验证</a-typography-title>
        <a-typography-paragraph>
          <div class="mt-25px">
            <div class="flex items-center">
              <MailOutlined :style="{ fontSize: '18px', color: '#08c' }" />
              <div class="mx-2">
                <div class="text-14px">
                  <span style="font-weight: bold">
                    {{ user.email }}
                  </span>
                  <span class="ml-25px ml-5" :underline="false">
                    <a-button v-if="user?.emailVerified" type="success" link>
                      <CheckOutlined />已验证
                    </a-button>
                    <a-button
                      v-else
                      type="primary"
                      link
                      @click="handleVerifyEmail"
                    >
                      <InfoCircleOutlined />立即验证
                    </a-button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a-typography-paragraph>
      </a-typography>
    </CardContent>
  </Card>
</template>

<style lang="scss" scoped>
.float-right {
  position: absolute;
  right: 38px;
  float: right !important;
}
</style>
