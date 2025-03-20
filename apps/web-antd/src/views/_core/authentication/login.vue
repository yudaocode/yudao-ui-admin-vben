<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';
import type { AuthApi } from '#/api/core/auth';

import { computed, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useAppConfig } from '@vben/hooks';

import { useAuthStore } from '#/store';
import { useAccessStore } from '@vben/stores';

import { getTenantSimpleList, getTenantByWebsite } from '#/api/core/auth';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const accessStore = useAccessStore();

// 租户列表
const tenantList = ref<AuthApi.TenantResult[]>([]);
// 当前选中的租户编号
const currentTenantId = ref<null | number>();

// 获取租户列表，并默认选中
const fetchTenantList = async () => {
  try {
    // 获取租户列表、域名对应租户
    const websiteTenantPromise = getTenantByWebsite(window.location.hostname);
    tenantList.value = await getTenantSimpleList();

    // 选中租户：域名 > store 中的租户 > 首个租户
    let tenantId: number | null = null;
    const websiteTenant = await websiteTenantPromise;
    if (websiteTenant?.id) {
      tenantId = websiteTenant.id;
    }
    // 如果没有从域名获取到租户，尝试从 store 中获取
    debugger;
    if (!tenantId && accessStore.tenantId) {
      tenantId = accessStore.tenantId;
    }
    // 如果还是没有租户，使用列表中的第一个
    if (!tenantId && tenantList.value?.[0]?.id) {
      tenantId = tenantList.value[0].id;
    }

    // 设置选中的租户编号
    currentTenantId.value = tenantId;
    accessStore.setTenantId(tenantId);
  } catch (error) {
    console.error('获取租户列表失败:', error);
  }
};

// 组件挂载时获取租户信息
onMounted(() => {
  fetchTenantList();
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: tenantList.value.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder: $t('authentication.selectTenant'),
        // value: currentTenantId.value ?? null, // TODO @芋艿：change 的设置
        onChange: (value: number) => {
          // currentTenantId.value = value ?? null;
          accessStore.setTenantId(value);
        },
      },
      fieldName: 'tenantId',
      label: $t('authentication.selectTenant'),
      // TODO @芋艿：开关租户的逻辑
      rules: z.number().default(currentTenantId.value), // TODO @芋艿：默认值的设置
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.usernameTip') })
        .default(import.meta.env.VITE_APP_DEFAULT_USERNAME),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.passwordTip') })
        .default(import.meta.env.VITE_APP_DEFAULT_PASSWORD),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authLogin"
  />
</template>
