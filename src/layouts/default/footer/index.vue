<script lang="ts" setup>
import { computed, ref, unref } from 'vue'
import { Layout } from 'ant-design-vue'

import { GithubFilled } from '@ant-design/icons-vue'

import { useRouter } from 'vue-router'
import { useLayoutHeight } from '../content/useContentViewHeight'
import { DOC_URL, GITHUB_URL, SITE_URL } from '@/settings/siteSetting'
import { openWindow } from '@/utils'

import { useI18n } from '@/hooks/web/useI18n'
import { useRootSetting } from '@/hooks/setting/useRootSetting'

defineOptions({ name: 'LayoutFooter' })

const SITE_TITLE = ref(import.meta.env.VITE_GLOB_APP_TITLE)

const Footer = Layout.Footer

const { t } = useI18n()
const { getShowFooter } = useRootSetting()
const { currentRoute } = useRouter()

const footerRef = ref<ComponentRef>(null)
const { setFooterHeight } = useLayoutHeight()

const getShowLayoutFooter = computed(() => {
  if (unref(getShowFooter)) {
    const footerEl = unref(footerRef)?.$el
    setFooterHeight(footerEl?.offsetHeight || 0)
  }
  else {
    setFooterHeight(0)
  }
  return unref(getShowFooter) && !unref(currentRoute).meta?.hiddenFooter
})
</script>

<template>
  <Footer v-if="getShowLayoutFooter" ref="footerRef" class="text-center text-[var(--normal-text)]">
    <div class="mb-2">
      <a class="text-[var(--normal-text)] hover:text-[var(--hover-text)]" @click="openWindow(SITE_URL)">外包咨询</a>

      <GithubFilled class="mx-7.5 hover:text-[var(--hover-text)]" @click="openWindow(GITHUB_URL)" />

      <a class="text-[var(--normal-text)] hover:text-[var(--hover-text)]" @click="openWindow(DOC_URL)">{{
        t('layout.footer.onlineDocument') }}</a>
    </div>
    <div>Copyright &copy;2023 {{ SITE_TITLE }}</div>
  </Footer>
</template>
