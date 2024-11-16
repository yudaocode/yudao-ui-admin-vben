<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { $t } from '@vben/locales';

import { getTenantByWebsite, getTenantIdByName } from '#/api/core/auth';
import { useAuthStore } from '#/store';
import { setTenantId } from '#/utils';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const { tenantEnable, captchaEnable } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'tenantName',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
      value: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
      value: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
      value: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
    },
  ];
});
const loginData = ref({
  captchaVerification: '',
  username: '',
  password: '',
  tenantName: '',
});
// 获取验证码
async function getCode(params: Recordable<any>) {
  if (params) {
    loginData.value = params;
  }
  getTenant()
    .then()
    .finally(async () => {
      // 情况一，未开启：则直接登录
      if (captchaEnable === 'false') {
        await handleLogin();
      } else {
        // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
        // 弹出验证码
        verify.value.show();
      }
    });
}

// 根据域名，获得租户信息 && 获取租户ID
async function getTenant() {
  if (tenantEnable === 'true') {
    const website = location.host;
    const tenant = await getTenantByWebsite(website);
    if (tenant) {
      loginData.value.tenantName = tenant.name;
      setTenantId(tenant.id);
    } else {
      const res = await getTenantIdByName(loginData.value.tenantName);
      setTenantId(res);
    }
  }
}

async function handleLogin() {
  authStore.authLogin(loginData.value);
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="getCode"
  />
</template>
