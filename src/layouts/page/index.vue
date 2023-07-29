<script lang="ts" setup>
import { computed, unref } from 'vue'

import { getTransitionName } from './transition'
import FrameLayout from '@/layouts/iframe/index.vue'

import { useRootSetting } from '@/hooks/setting/useRootSetting'

import { useTransitionSetting } from '@/hooks/setting/useTransitionSetting'
import { useMultipleTabSetting } from '@/hooks/setting/useMultipleTabSetting'

import { useMultipleTabStore } from '@/store/modules/multipleTab'

defineOptions({ name: 'PageLayout' })

const { getShowMultipleTab } = useMultipleTabSetting()
const tabStore = useMultipleTabStore()

const { getOpenKeepAlive, getCanEmbedIFramePage } = useRootSetting()

const { getBasicTransition, getEnableTransition } = useTransitionSetting()

const openCache = computed(() => unref(getOpenKeepAlive) && unref(getShowMultipleTab))

const getCaches = computed((): string[] => {
  if (!unref(getOpenKeepAlive))
    return []

  return tabStore.getCachedTabList
})
</script>

<template>
  <RouterView>
    <template #default="{ Component, route }">
      <transition
        :name="
          getTransitionName({
            route,
            openCache,
            enableTransition: getEnableTransition,
            cacheTabs: getCaches,
            def: getBasicTransition,
          })
        "
        mode="out-in"
        appear
      >
        <keep-alive v-if="openCache" :include="getCaches">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
        <component :is="Component" v-else :key="route.fullPath" />
      </transition>
    </template>
  </RouterView>
  <FrameLayout v-if="getCanEmbedIFramePage" />
</template>
