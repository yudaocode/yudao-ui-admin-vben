<script lang="ts" setup>
import { computed, unref } from 'vue'
import { Divider, Popover, QRCode } from 'ant-design-vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useLoginState } from './useLogin'
import { useI18n } from '@/hooks/web/useI18n'

import loginImg from '@/assets/images/logo.png'

const qrCodeUrl = 'https://vben.xingyuv.com/login'

const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)
</script>

<template>
  <div v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <div class="enter-x min-h-64 min-w-64">
      <Popover :overlay-inner-style="{ padding: 0 }">
        <template #content>
          <QRCode :value="qrCodeUrl" class="enter-x flex justify-center xl:justify-start" :width="280" :bordered="false" />
        </template>
        <img width="100" height="100" :src="loginImg">
      </Popover>
      <Divider class="enter-x">
        {{ t('sys.login.scanSign') }}
      </Divider>
      <a-button size="large" block class="enter-x mt-4" @click="handleBackLogin">
        {{ t('sys.login.backSignIn') }}
      </a-button>
    </div>
  </div>
</template>
