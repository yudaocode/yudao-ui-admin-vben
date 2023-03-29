<template>
  <LayoutLockPage />
  <BackTop v-if="getUseOpenBackTop" :target="getTarget" />
  <SettingDrawer v-if="getIsFixedSettingDrawer" :class="prefixCls" />
  <SessionTimeoutLogin v-if="getIsSessionTimeout" />
</template>
<script lang="ts" setup name="LayoutFeatures">
import { computed, unref } from 'vue'
import { BackTop } from 'ant-design-vue'

import { useRootSetting } from '@/hooks/setting/useRootSetting'
import { useHeaderSetting } from '@/hooks/setting/useHeaderSetting'
import { useDesign } from '@/hooks/web/useDesign'
import { useUserStoreWithOut } from '@/store/modules/user'

import { SettingButtonPositionEnum } from '@/enums/appEnum'
import { createAsyncComponent } from '@/utils/factory/createAsyncComponent'

import SessionTimeoutLogin from '@/views/sys/login/SessionTimeoutLogin.vue'

const LayoutLockPage = createAsyncComponent(() => import('@/views/sys/lock/index.vue'))

const SettingDrawer = createAsyncComponent(() => import('@/layouts/default/setting/index.vue'))

const { getUseOpenBackTop, getShowSettingButton, getSettingButtonPosition, getFullContent } = useRootSetting()
const userStore = useUserStoreWithOut()
const { prefixCls } = useDesign('setting-drawer-feature')
const { getShowHeader } = useHeaderSetting()

const getTarget = () => document.body

const getIsSessionTimeout = computed(() => userStore.getSessionTimeout)

const getIsFixedSettingDrawer = computed(() => {
  if (!unref(getShowSettingButton)) {
    return false
  }
  const settingButtonPosition = unref(getSettingButtonPosition)

  if (settingButtonPosition === SettingButtonPositionEnum.AUTO) {
    return !unref(getShowHeader) || unref(getFullContent)
  }
  return settingButtonPosition === SettingButtonPositionEnum.FIXED
})
</script>
<style lang="less">
@prefix-cls: ~'@{namespace}-setting-drawer-feature';

.@{prefix-cls} {
  position: absolute;
  top: 45%;
  right: 0;
  z-index: 10;
  display: flex;
  padding: 10px;
  color: @white;
  cursor: pointer;
  background-color: @primary-color;
  border-radius: 6px 0 0 6px;
  justify-content: center;
  align-items: center;

  svg {
    width: 1em;
    height: 1em;
  }
}
</style>
