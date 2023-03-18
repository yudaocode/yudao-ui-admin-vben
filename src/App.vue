<template>
  <ConfigProvider :locale="getAntdLocale" :component-size="componentSize">
    <AppProvider>
      <RouterView />
    </AppProvider>
  </ConfigProvider>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ConfigProvider } from 'ant-design-vue'
import { AppProvider } from '@/components/Application'
import { useTitle } from '@/hooks/web/useTitle'
import { useLocale } from '@/locales/useLocale'
import { useAppStore } from '@/store/modules/app'

import 'dayjs/locale/zh-cn'
// support Multi-language
const { getAntdLocale } = useLocale()

const appStore = useAppStore()

const componentSize = computed(() => appStore.getComponentSize)

// Listening to page changes and dynamically changing site titles
useTitle()
</script>
