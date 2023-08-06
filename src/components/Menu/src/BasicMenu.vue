<script lang="ts" setup>
import { computed, reactive, ref, toRefs, unref, watch } from 'vue'
import { Menu } from 'ant-design-vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter } from 'vue-router'
import type { MenuState } from './types'
import BasicSubMenuItem from './components/BasicSubMenuItem.vue'
import { useOpenKeys } from './useOpenKeys'
import { basicProps } from './props'
import { MenuModeEnum, MenuTypeEnum } from '@/enums/menuEnum'
import { isFunction } from '@/utils/is'
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { REDIRECT_NAME } from '@/router/constant'
import { useDesign } from '@/hooks/web/useDesign'
import { getCurrentParentPath } from '@/router/menus'
import { listenerRouteChange } from '@/logics/mitt/routeChange'
import { getAllParentPath } from '@/router/helper/menuHelper'

defineOptions({ name: 'BasicMenu' })

const props = defineProps(basicProps)
const emit = defineEmits(['menuClick'])

const isClickGo = ref(false)
const currentActiveMenu = ref('')

const menuState = reactive<MenuState>({
  defaultSelectedKeys: [],
  openKeys: [],
  selectedKeys: [],
  collapsedOpenKeys: [],
})

const { prefixCls } = useDesign('basic-menu')
const { items, mode, accordion } = toRefs(props)

const { getCollapsed, getTopMenuAlign, getSplit } = useMenuSetting()

const { currentRoute } = useRouter()

const { handleOpenChange, setOpenKeys, getOpenKeys } = useOpenKeys(menuState, items, mode as any, accordion)

const getIsTopMenu = computed(() => {
  const { type, mode } = props

  return (type === MenuTypeEnum.TOP_MENU && mode === MenuModeEnum.HORIZONTAL) || (props.isHorizontal && unref(getSplit))
})

const getMenuClass = computed(() => {
  const align = props.isHorizontal && unref(getSplit) ? 'start' : unref(getTopMenuAlign)
  return [
    prefixCls,
    `justify-${align}`,
    {
      [`${prefixCls}__second`]: !props.isHorizontal && unref(getSplit),
      [`${prefixCls}__sidebar-hor`]: unref(getIsTopMenu),
    },
  ]
})

const getInlineCollapseOptions = computed(() => {
  const isInline = props.mode === MenuModeEnum.INLINE

  const inlineCollapseOptions: { inlineCollapsed?: boolean } = {}
  if (isInline)
    inlineCollapseOptions.inlineCollapsed = props.mixSider ? false : unref(getCollapsed)

  return inlineCollapseOptions
})

listenerRouteChange((route) => {
  if (route.name === REDIRECT_NAME)
    return
  handleMenuChange(route)
  currentActiveMenu.value = route.meta?.currentActiveMenu as string

  if (unref(currentActiveMenu)) {
    menuState.selectedKeys = [unref(currentActiveMenu)]
    setOpenKeys(unref(currentActiveMenu))
  }
})

!props.mixSider
  && watch(
    () => props.items,
    () => {
      handleMenuChange()
    },
  )

async function handleMenuClick({ key }) {
  const { beforeClickFn } = props
  if (beforeClickFn && isFunction(beforeClickFn)) {
    const flag = await beforeClickFn(key)
    if (!flag)
      return
  }
  emit('menuClick', key)

  isClickGo.value = true
  menuState.selectedKeys = [key]
}

async function handleMenuChange(route?: RouteLocationNormalizedLoaded) {
  if (unref(isClickGo)) {
    isClickGo.value = false
    return
  }
  const path = (route || unref(currentRoute)).meta?.currentActiveMenu || (route || unref(currentRoute)).path
  setOpenKeys(path)
  if (unref(currentActiveMenu))
    return
  if (props.isHorizontal && unref(getSplit)) {
    const parentPath = await getCurrentParentPath(path)
    menuState.selectedKeys = [parentPath]
  }
  else {
    const parentPaths = await getAllParentPath(props.items, path)
    menuState.selectedKeys = parentPaths
  }
}
</script>

<template>
  <Menu
    :selected-keys="menuState.selectedKeys"
    :default-selected-keys="menuState.defaultSelectedKeys"
    :mode="mode"
    :open-keys="getOpenKeys"
    :inline-indent="inlineIndent"
    :theme="theme"
    :class="getMenuClass"
    :sub-menu-open-delay="0.2"
    v-bind="getInlineCollapseOptions"
    @open-change="handleOpenChange"
    @click="handleMenuClick"
  >
    <template v-for="item in items" :key="item.path">
      <BasicSubMenuItem :item="item" :theme="theme" :is-horizontal="isHorizontal" />
    </template>
  </Menu>
</template>

<style lang="less">
@import './index.less';
</style>
