<template>
  <Dropdown
    :dropMenuList="getDropMenuList"
    :trigger="getTrigger"
    placement="bottom"
    overlayClassName="multiple-tabs__dropdown"
    @menu-event="handleMenuEvent"
  >
    <div :class="`${prefixCls}__info`" @contextmenu="handleContext" v-if="getIsTabs">
      <span v-if="getShowTabsIcon" :class="`${prefixCls}__prefix-icon`" @click="handleContext">
        <Icon :icon="prefixIconType" />
      </span>
      <span class="ml-1">{{ getTitle }}</span>
    </div>
    <span :class="`${prefixCls}__extra-quick`" v-else @click="handleContext">
      <Icon icon="ion:chevron-down" />
    </span>
  </Dropdown>
</template>
<script lang="ts" setup>
import type { RouteLocationNormalized } from 'vue-router'

import { computed, unref } from 'vue'
import { Dropdown } from '@/components/Dropdown'
import { Icon } from '@/components/Icon'

import { TabContentProps } from '../types'

import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'
import { useTabDropdown } from '../useTabDropdown'
import { useMultipleTabSetting } from '@/hooks/setting/useMultipleTabSetting'

defineOptions({ name: 'TabContent' })

const props = defineProps({
  tabItem: {
    type: Object as PropType<RouteLocationNormalized>,
    default: null
  },
  isExtra: Boolean
})
const { prefixCls } = useDesign('multiple-tabs-content')
const { t } = useI18n()

const getTitle = computed(() => {
  const { tabItem: { meta } = {} } = props
  return meta && t(meta.title as string)
})

const getIsTabs = computed(() => !props.isExtra)

const prefixIconType = computed(() => {
  if (props.tabItem.meta.icon) {
    return props.tabItem.meta.icon
  } else if (props.tabItem.path === '/dashboard/analysis') {
    return 'ant-design:home-outlined'
  } else {
    return 'ant-design:code'
  }
})

const getTrigger = computed((): ('contextmenu' | 'click' | 'hover')[] => (unref(getIsTabs) ? ['contextmenu'] : ['click']))

const { getDropMenuList, handleMenuEvent, handleContextMenu } = useTabDropdown(props as TabContentProps, getIsTabs)

const { getShowMultipleTabIcon } = useMultipleTabSetting()

const getShowTabsIcon = computed(() => {
  return unref(getShowMultipleTabIcon)
})

function handleContext(e) {
  props.tabItem && handleContextMenu(props.tabItem)(e)
}
</script>
