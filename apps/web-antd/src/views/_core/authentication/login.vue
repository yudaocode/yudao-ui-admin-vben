<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, reactive, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import { $t } from '@vben/locales';

import { getTenantByWebsite, getTenantIdByName } from '#/api/core/auth';
import { Verify } from '#/components/Verification';
import { useAuthStore } from '#/store';
import { setTenantId } from '#/utils';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
/**
 * 初始化验证码
 * blockPuzzle 滑块
 * clickWord 点击文字
 */
const verify = ref();
const captchaType = ref('blockPuzzle');

const { tenantEnable, captchaEnable } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('page.auth.tenantNameTip'),
      },
      fieldName: 'tenantName',
      label: $t('page.auth.tenantname'),
      rules: z.string().min(1, { message: $t('page.auth.tenantNameTip') }),
      defaultValue: import.meta.env.VITE_APP_DEFAULT_LOGIN_TENANT || '',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('page.auth.usernameTip'),
      },
      fieldName: 'username',
      label: $t('page.auth.username'),
      rules: z.string().min(1, { message: $t('page.auth.usernameTip') }),
      defaultValue: import.meta.env.VITE_APP_DEFAULT_LOGIN_USERNAME || '',
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('page.auth.passwordTip'),
      },
      fieldName: 'password',
      label: $t('page.auth.password'),
      rules: z.string().min(1, { message: $t('page.auth.passwordTip') }),
      defaultValue: import.meta.env.VITE_APP_DEFAULT_LOGIN_PASSWORD || '',
    },
  ];
});
const loginData = reactive({
  loginForm: {
    username: '',
    password: '',
    tenantName: '',
  },
});
const captchaVerification = ref('');
// 获取验证码
async function getCode(params: any) {
  if (params) {
    loginData.loginForm = params;
  }
  try {
    await getTenant();
    if (captchaEnable) {
      // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
      // 弹出验证码
      verify.value.show();
    } else {
      // 情况一，未开启：则直接登录
      await handleLogin({});
    }
  } catch (error) {
    console.error('Error in getCode:', error);
  }
}

// 根据域名，获得租户信息 && 获取租户ID
async function getTenant() {
  if (tenantEnable) {
    const website = location.host;
    try {
      const tenant = await getTenantByWebsite(website);
      if (tenant) {
        loginData.loginForm.tenantName = tenant.name;
        setTenantId(tenant.id);
      } else {
        const res = await getTenantIdByName(loginData.loginForm.tenantName);
        setTenantId(res);
      }
    } catch (error) {
      console.error('Error in getTenant:', error);
    }
  }
}

async function handleLogin(params: any) {
  if (!params.captchaVerification && captchaEnable) {
    console.error('Captcha verification is required');
    return;
  }
  captchaVerification.value = params.captchaVerification;
  try {
    await authStore.authLogin({
      ...loginData.loginForm,
      captchaVerification: captchaVerification.value,
    });
  } catch (error) {
    console.error('Error in handleLogin:', error);
  }
}
</script>

<template>
  <div>
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      @submit="getCode"
    />
    <Verify
      ref="verify"
      :captcha-type="captchaType"
      :img-size="{ width: '400px', height: '200px' }"
      mode="pop"
      @success="handleLogin"
    />
  </div>
</template>
