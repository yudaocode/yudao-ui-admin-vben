<script lang="ts" setup>
import { computed, unref } from 'vue'
import { Button, Divider, Popover, QRCode } from 'ant-design-vue'
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
    <div class="enter-x min-w-64 min-h-64">
      <Popover :overlay-inner-style="{ padding: 0 }">
        <template #content>
          <QRCode :value="qrCodeUrl" class="enter-x flex justify-center xl:justify-start" :width="280" :bordered="false" />
        </template>
        <img width="100" height="100" :src="loginImg">
      </Popover>
      <Divider class="enter-x">
        {{ t('sys.login.scanSign') }}
      </Divider>
      <Button size="large" block class="mt-4 enter-x" @click="handleBackLogin">
        {{ t('sys.login.backSignIn') }}
      </Button>
    </div>
  </div>
</template>
