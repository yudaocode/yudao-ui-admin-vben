<script setup lang="ts">
import {
  MdiGithub,
  MdiGoogle,
  MdiQqchat,
  MdiWechat,
  RiDingding,
} from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenButton, VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({
  name: 'ThirdPartyLogin',
});

const emit = defineEmits<{
  thirdLogin: [type: number];
}>();

/**
 * 处理第三方登录点击
 *
 * @param type 第三方平台类型
 */
function handleThirdLogin(type: number) {
  emit('thirdLogin', type);
}
</script>

<template>
  <div class="w-full sm:mx-auto md:max-w-md">
    <div class="mt-4 flex items-center justify-between">
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
      <span class="text-muted-foreground text-center text-xs uppercase">
        {{ $t('authentication.thirdPartyLogin') }}
      </span>
      <span class="border-input w-[35%] border-b dark:border-gray-600"></span>
    </div>

    <div class="mt-4 flex flex-wrap justify-center">
      <VbenButton
        class="bg-success w-[100%]"
        :loading="false"
        type="primary"
        color="success"
        aria-label="login"
        @click="handleThirdLogin(40)"
      >
        <MdiGoogle /> {{ $t('使用Google登陆') }}
      </VbenButton>
      <VbenIconButton v-if="false" class="mb-3" @click="handleThirdLogin(30)">
        <MdiWechat />
      </VbenIconButton>
      <VbenIconButton v-if="false" class="mb-3" @click="handleThirdLogin(20)">
        <RiDingding />
      </VbenIconButton>
      <VbenIconButton v-if="false" class="mb-3" @click="handleThirdLogin(0)">
        <MdiQqchat />
      </VbenIconButton>
      <VbenIconButton v-if="false" class="mb-3" @click="handleThirdLogin(0)">
        <MdiGithub />
      </VbenIconButton>
    </div>
  </div>
</template>
