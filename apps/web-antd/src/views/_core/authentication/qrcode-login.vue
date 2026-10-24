<script lang="ts" setup>
import type { AuthApi } from '#/api/core/auth';

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { AuthenticationQrCodeLogin, VbenButton } from '@vben/common-ui';
import { LOGIN_PATH } from '@vben/constants';
import { isTenantEnable } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore } from '@vben/stores';

import { useQRCode } from '@vueuse/integrations/useQRCode';

import {
  AuthQrcodeStatusEnum,
  createQrcode,
  pollQrcode,
} from '#/api/core/auth';

defineOptions({ name: 'QrCodeLogin' });

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const ticket = ref<AuthApi.QrcodeCreateResult>();
const loading = ref(false);
const error = ref('');
const qrcode = useQRCode(
  computed(() => ticket.value?.qrContent || ''),
  {
    errorCorrectionLevel: 'H',
    margin: 4,
  },
);
const loginPath = computed(
  () => router.resolve({ path: LOGIN_PATH, query: route.query }).fullPath,
);
let stopPolling = () => {};

/** 生成二维码，串行轮询；刷新和离开页面时停止旧任务 */
async function createLoginQrcode() {
  stopPolling();
  let stopped = false;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  stopPolling = () => {
    stopped = true;
    clearTimeout(pollTimer);
  };
  const fail = () => {
    if (stopped) return;
    stopPolling();
    loading.value = false;
    error.value = ticket.value
      ? '二维码已失效，请刷新后重新扫码'
      : '二维码生成失败，请刷新后重试';
  };
  ticket.value = undefined;
  error.value = '';
  loading.value = true;
  try {
    const created = await createQrcode();
    if (stopped) return;
    ticket.value = created;
    loading.value = false;
    const poll = async () => {
      try {
        const result = await pollQrcode({
          qrcodeId: created.qrcodeId,
          secret: created.secret,
        });
        if (stopped) return;
        if (result.status === AuthQrcodeStatusEnum.WAITING) {
          pollTimer = setTimeout(poll, 2000);
          return;
        }
        if (result.status !== AuthQrcodeStatusEnum.CONFIRMED || !result.login) {
          fail();
          return;
        }
        stopPolling();
        // 保留登录页所选租户，清除旧账号缓存，重载权限和动态路由。
        const tenantId = accessStore.tenantId;
        resetAllStores();
        // 等待重置后的持久化监听恢复，再写入新登录态。
        await nextTick();
        accessStore.setTenantId(tenantId);
        accessStore.setAccessToken(result.login.accessToken);
        accessStore.setRefreshToken(result.login.refreshToken);
        await nextTick();
        let target = new URL(
          router.resolve(preferences.app.defaultHomePath).href,
          location.origin,
        );
        try {
          const redirect = route.query.redirect;
          const path =
            typeof redirect === 'string'
              ? decodeURIComponent(redirect)
              : preferences.app.defaultHomePath;
          if (path.startsWith('/') && !path.startsWith('//')) {
            const candidate = new URL(
              router.resolve(path).href,
              location.origin,
            );
            if (candidate.origin === location.origin) target = candidate;
          }
        } catch {
          // 无效的跳转参数返回首页。
        }
        location.assign(target.pathname + target.search + target.hash);
      } catch {
        fail();
      }
    };
    pollTimer = setTimeout(poll, 2000);
  } catch {
    fail();
  }
}

onMounted(() => {
  if (isTenantEnable() && !accessStore.tenantId) {
    void router.replace(loginPath.value);
    return;
  }
  void createLoginQrcode();
});
onBeforeUnmount(() => stopPolling());
</script>

<template>
  <AuthenticationQrCodeLogin
    :login-path="loginPath"
    title="扫码登录"
    sub-title="使用管理后台手机端确认登录"
    description="请使用管理后台手机端扫一扫，并确认登录"
  >
    <template #qrcode>
      <img
        v-if="qrcode && !error && !loading"
        :src="qrcode"
        alt="扫码登录二维码"
        class="h-56 w-56"
      />
      <div v-else class="flex-col-center h-56 w-56 text-center">
        <span class="text-muted-foreground">
          {{ loading ? '正在生成二维码…' : error }}
        </span>
        <VbenButton v-if="error" class="mt-4" @click="createLoginQrcode">
          刷新二维码
        </VbenButton>
      </div>
    </template>
  </AuthenticationQrCodeLogin>
</template>
