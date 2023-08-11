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
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'LayoutFooter' })

const SITE_TITLE = ref(import.meta.env.VITE_GLOB_APP_TITLE)

const Footer = Layout.Footer

const { t } = useI18n()
const { getShowFooter } = useRootSetting()
const { currentRoute } = useRouter()
const { prefixCls } = useDesign('layout-footer')

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
  <Footer v-if="getShowLayoutFooter" ref="footerRef" :class="prefixCls">
    <div :class="`${prefixCls}__links`">
      <a @click="openWindow(SITE_URL)">外包咨询</a>

      <GithubFilled :class="`${prefixCls}__github`" @click="openWindow(GITHUB_URL)" />

      <a @click="openWindow(DOC_URL)">{{ t('layout.footer.onlineDocument') }}</a>
    </div>
    <div>Copyright &copy;2023 {{ SITE_TITLE }}</div>
  </Footer>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-layout-footer';

html{
  --normal-text:#b6b7b9;
  --hover-text: rgb(0 0 0 / 85%);
}

html[data-theme="dark"] {
  --normal-text:rgb(255 255 255 0.85);
  --hover-text: rgb(0 0 0 / 85%);
}

.@{prefix-cls} {
  color: var(--normal-text);
  text-align: center;

  &__links {
    margin-bottom: 8px;

    a {
      color: var(--normal-text);

      &:hover {
        color: var(--hover-text);
      }
    }
  }

  &__github {
    margin: 0 30px;

    &:hover {
      color: var(--hover-text);
    }
  }
}
</style>
