<script lang="ts" setup>
import 'dayjs/locale/zh-cn'

import { ConfigProvider } from 'ant-design-vue'
import { storeToRefs } from 'pinia'

import { AppProvider } from '@/components/Application'
import { useTitle } from '@/hooks/web/useTitle'
import { useLocale } from '@/locales/useLocale'
import { useAppStore } from '@/store/modules/app'

// support Multi-language
const { getAntdLocale } = useLocale()
const appStore = useAppStore()
const { themeConfig } = storeToRefs(appStore)
// Listening to page changes and dynamically changing site titles
useTitle()
</script>

<template>
  <ConfigProvider :locale="getAntdLocale" :theme="themeConfig">
    <AppProvider>
      <RouterView />
    </AppProvider>
  </ConfigProvider>
</template>
